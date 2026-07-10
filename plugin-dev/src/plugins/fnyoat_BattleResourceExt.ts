//=============================================================================
// fnyoat_BattleResourceExt.ts
//=============================================================================

/*:
 * @plugindesc [战斗资源拓展] 击倒时允许负HP，不再锁0
 * @author fnyoat
 *
 * @param Allow Negative HP
 * @text 允许负血量
 * @type boolean
 * @default true
 * @desc 角色被击倒时HP是否允许降到0以下（追踪过量伤害）
 *
 * @param Negative HP Floor
 * @text 负血量下限
 * @type number
 * @default -99999
 * @desc 负血量的绝对下限，防止极端情况溢出
 *
 * @help
 * ============================================================================
 * 战斗资源拓展 说明
 * ============================================================================
 *
 * 功能：
 *   敌人攻击角色时，击倒不再将血量锁定为0，而是可以降到负值。
 *   这样可以追踪"过量伤害"，适用于需要知道角色被打到多惨的场景。
 *
 * 规则：
 *   - 仅对角色(actor)生效，敌人仍正常锁0
 *   - HP <= 0 时角色仍然视为死亡，死亡状态正常触发
 *   - 负HP角色的hpRate()返回0，血条显示为空
 *   - 可以通过负HP值判断需要多少治疗量才能把人救回来
 *   - 负血量有绝对下限，防止极端情况溢出
 *
 */

(function() {
    const params = PluginManager.parameters('fnyoat_BattleResourceExt');
    const config = {
        allowNegativeHp: params['Allow Negative HP'] !== 'false',
        negativeHpFloor: Number(params['Negative HP Floor']) || -99999,
    };

    if (!config.allowNegativeHp) return;

    // ---- 核心：重写 refresh，阻止它对角色 clamp _hp 到 0 ----
    // Game_BattlerBase.refresh 里有 this._hp.clamp(0, mhp)，会立即擦掉负血
    const B_ = Game_BattlerBase.prototype as any;
    const _old_refresh_base = B_.refresh;
    B_.refresh = function(): void {
        if (this.isActor && this.isActor()) {
            // 对角色：正常做 state resist / mp clamp / tp clamp，但 hp 只保上限
            this.stateResistSet().forEach(function(stateId: number) {
                this.eraseState(stateId);
            }, this);
            this._hp = Math.min(this._hp, this.mhp);
            this._mp = (this._mp).clamp(0, this.mmp);
            this._tp = (this._tp).clamp(0, this.maxTp());
        } else {
            _old_refresh_base.call(this);
        }
    };

    // ---- 覆写 setHp：角色允许负血，但最多负到 -mhp ----
    const _old_setHp = B_.setHp;
    B_.setHp = function(hp: number): void {
        if (this.isActor && this.isActor()) {
            const hpBottom = Math.max(config.negativeHpFloor, -Math.max(500, this.mhp));
            this._hp = Math.max(hpBottom, Math.min(hp, this.mhp));
        } else {
            this._hp = (hp < 0 ? 0 : (hp > this.mhp ? this.mhp : hp));
        }
        this.refresh();
    };

    // ---- Game_Battler.refresh：将 if (hp === 0) 改为 if (hp <= 0) ----
    // 否则负血角色不会进入死亡状态，isDead 返回 false
    const _old_refresh_battler = (Game_Battler.prototype as any).refresh;
    (Game_Battler.prototype as any).refresh = function(): void {
        B_.refresh.call(this);
        if (this.isActor && this.isActor()) {
            if (this._hp <= 0) {
                this.addState(this.deathStateId());
            } else {
                this.removeState(this.deathStateId());
            }
        } else {
            if (this.hp === 0) {
                this.addState(this.deathStateId());
            } else {
                this.removeState(this.deathStateId());
            }
        }
    };

    // ---- 覆写 die()：阻止 addNewState 在给角色添加死亡状态时把 _hp 擦成 0 ----
    // 链路：addState(deathId) → addNewState(deathId) → die() → this._hp = 0
    const _old_die = B_.die;
    B_.die = function(): void {
        if (!(this.isActor && this.isActor())) {
            this._hp = 0;
        }
        this.clearStates();
        this.clearBuffs();
    };

    // ---- 覆写 revive()：负血角色复活时也能正确把 hp 设为 1 ----
    // 否则 _hp === 0 判定为 false（因为 _hp 是负数），复活后 hp 仍然为负
    const _old_revive = B_.revive;
    B_.revive = function(): void {
        if (this.isActor && this.isActor()) {
            if (this._hp <= 0) {
                this._hp = 1;
            }
        } else {
            _old_revive.call(this);
        }
    };

    // ---- 覆写 hpRate：负HP时血条归零 ----
    const _old_hpRate = B_.hpRate;
    B_.hpRate = function(): number {
        if (this.isActor && this.isActor()) {
            if (this._hp <= 0) return 0;
            return Math.min(1, this._hp / this.mhp);
        }
        return _old_hpRate.call(this);
    };

    // ---- 覆写 isDying：负血角色救回来之前应该一直处于"濒死"状态 ----
    // 但需要 isAlive 为 true 才能触发。负血角色 isAlive/dying 都用原生判定。
    // 这里不做额外处理，避免干扰复活/治疗逻辑。

    // ========================================================================
    //  负血交互层：所有友方技能可指向死人 + 治疗卡0 + 复活兜底
    // ========================================================================

    // ---- 帮助函数：当前是否是"以角色队伍为友方目标" ----
    const isTargetingActorParty = function(ga: any): boolean {
        return ga.isForFriend() && ga.friendsUnit() === $gameParty;
    };

    // ---- 覆写 gainHp：死亡角色非复活治疗惩罚 25%，且同一 action 内只允许首次生效 ----
    // 用模块级标志区分复活技能，避免 gainHp 无法感知 context 的问题
    // 注意：gainHp 定义在 Game_Battler.prototype，不在 Game_BattlerBase.prototype
    // _nonResurrectionHealed 标记：同 action 内第二次 gainHp 直接卡 0，防止跳两个治疗数字
    let _resurrectionInProgress = false;
    {
        const _old_gainHp = (Game_Battler.prototype as any).gainHp;
        (Game_Battler.prototype as any).gainHp = function(value: number): void {
            if (value > 0 && this.isActor && this.isActor() && this._hp <= 0) {
                if (!_resurrectionInProgress) {
                    if (this._nonResurrectionHealed) {
                        return;  // 同 action 内第二次治疗：直接跳过，不污染 result
                    }
                    value = Math.min(value * 0.25, -this._hp);  // 25% 惩罚 + 封顶 0
                    this._nonResurrectionHealed = true;
                }
                // 复活标签：全额生效，不拦截
            }
            _old_gainHp.call(this, value);
        };
    }

    // ---- 覆写 apply：复活技能结算后 HP 仍 ≤ 0 则抬到 1 ----
    // 用 meta["Resurrection"] 显式标签判断复活，避免 scope=9 的非复活物品错误救人
    // 进入 action 时重置 _nonResurrectionHealed，保证每次 action 独立判断
    {
        const _old_apply_bre = (Game_Action.prototype as any).apply;
        (Game_Action.prototype as any).apply = function(target: any): void {
            const item = this.item();
            const isResurrection = item && item.meta && item.meta['Resurrection'];
            if (isResurrection) {
                _resurrectionInProgress = true;
            }
            // 重置去重标志，让 gainHp 能在本次 action 中重新判断
            if (target && target.isActor && target.isActor()) {
                target._nonResurrectionHealed = false;
            }
            _old_apply_bre.call(this, target);
            _resurrectionInProgress = false;

            if (target.isActor && target.isActor()) {
                if (isResurrection && target._hp <= 0) {
                    target._hp = 1;
                    target.refresh();
                }
            }
        };
    }

    // ---- 覆写 itemTargetCandidates：角色友方技能可选取含死人的全员 ----
    {
        const _old = Game_Action.prototype.itemTargetCandidates;
        Game_Action.prototype.itemTargetCandidates = function() {
            if (isTargetingActorParty(this)) {
                if (this.isForUser()) return [this.subject()];
                return this.friendsUnit().members();
            }
            return _old.call(this);
        };
    }

    // ---- 覆写 targetsForFriends：执行时也按全员来取目标 ----
    {
        const _old = (Game_Action.prototype as any).targetsForFriends;
        (Game_Action.prototype as any).targetsForFriends = function() {
            if (isTargetingActorParty(this) && !this.isForUser()) {
                const unit = this.friendsUnit();
                if (this.isForOne()) {
                    const idx = Math.max(0, this._targetIndex);
                    return [unit.members()[idx]];
                }
                return unit.members();
            }
            return _old.call(this);
        };
    }

    // ---- 覆写 testApply：角色友方技能跳过生死校验 ----
    {
        const _old = Game_Action.prototype.testApply;
        Game_Action.prototype.testApply = function(target: any) {
            if (isTargetingActorParty(this) && target.isActor && target.isActor()) {
                if (this.isForUser()) return target === this.subject();
                return true;
            }
            return _old.call(this, target);
        };
    }

})();
