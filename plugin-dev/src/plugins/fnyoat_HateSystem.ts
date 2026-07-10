//=============================================================================
// fnyoat_HateSystem.ts
//=============================================================================

/*:
 * @plugindesc [仇恨系统] MMORPG风格仇恨系统 - 嘲讽、仇恨复制、仇恨衰减、切换目标惩罚
 * @author fnyoat
 *
 * @param Damage Hate Rate
 * @text 伤害仇恨倍率(%)
 * @type number
 * @default 100
 * @desc 对目标敌人造成伤害时，仇恨增加量 = 有效伤害 × 此值%
 *
 * @param AoE Hate Rate
 * @text AOE伤害仇恨倍率(%)
 * @type number
 * @default 30
 * @desc 对非目标敌人造成伤害时，仇恨增加量 = 有效伤害 × 此值%
 *
 * @param Heal Hate Rate
 * @text 治疗仇恨倍率(%)
 * @type number
 * @default 50
 * @desc 治疗队友时，仇恨增加量 = 有效治疗 × 此值% ÷ 敌人数量
 *
 * @param Hate Decay Per Turn
 * @text 每回合仇恨衰减
 * @type number
 * @default 5
 * @desc 每回合所有角色的仇恨值减少此数值
 *
 * @param Taunt Catch Up Rate
 * @text 嘲讽追赶比例(%)
 * @type number
 * @default 50
 * @desc 嘲讽时，追赶当前仇恨第一名的差值百分比
 *
 * @param Threat Multiplier Threshold
 * @text 仇恨领先阈值(%)
 * @type number
 * @default 110
 * @desc 第一名仇恨超过第二名此百分比时，触发切换目标惩罚
 *
 * @param Threat Weight Bonus
 * @text 切换目标惩罚权重倍率
 * @type number
 * @default 1.5
 * @desc 触发切换目标惩罚时的目标选择权重倍率（仅首次超过时生效）
 *
 * @param Hate Weight Base
 * @text 仇恨基础权重(%)
 * @type number
 * @default 50
 * @desc 仇恨在目标选择中的基础权重占比(%)，剩余为随机
 *
 * @param First Place Bonus
 * @text 第一名权重提升(%)
 * @type number
 * @default 10
 * @desc 仇恨第一名始终获得的权重加成百分比
 *
 * @param Focus Fire Weight
 * @text 集火权重倍数
 * @type number
 * @default 100
 * @desc 持有集火状态时，目标选择权重乘以此倍数（嘲讽优先于集火）
 *
 * @help
 * ============================================================================
 * 仇恨系统说明
 * ============================================================================
 *
 * 核心机制：
 *   1. 伤害仇恨：对敌人造成伤害时，增加伤害值100%的仇恨
 *   2. AOE仇恨：对其他敌人造成伤害时，增加伤害值30%的仇恨
 *   3. 治疗仇恨：治疗队友时，增加治疗值50%的仇恨，平均分给所有敌人
 *   4. 仇恨衰减：每回合所有角色的仇恨值减少5
 *   5. 切换目标惩罚：当某人仇恨从低于第二名110%变为超过110%时触发
 *      - 持续超过不算新惩罚
 *      - 掉到第二名后重新超过算新惩罚
 *
 * 嘲讽机制：
 *   - 对指定敌人使用嘲讽，追赶当前仇恨第一名的差值(默认50%)
 *   - 嘲讽状态下的敌人锁定攻击嘲讽者
 *   - 若已是仇恨第一则不增加仇恨，仅锁定目标
 *   - 技能备注标签 <Taunt> 可在命中敌人时自动嘲讽
 *
 * 技能备注标签：
 *   <Hate Bonus: N>    - 命中时对该敌人额外增加N点仇恨（自身目标时对所有敌人生效）
 *   <Taunt>            - 命中时嘲讽目标敌人（自身目标时对所有敌人生效）
 *   <Hit Independent>   - 以上标签即使未命中也生效
 *
 * 状态备注标签：
 *   <Hate Multiplier: X> - 持有此状态时，产生仇恨变为 X%(默认100)
 *   <Hate Per Turn: N>   - 持有此状态时，每回合对所有敌人增加 N 点仇恨
 *   <Taunt State>        - 持有此状态时，所有敌人强制攻击此角色（控制，最高优先级）
 *   <Focus Fire>         - 持有此状态时，目标权重×N倍，敌人主动集火此角色（可被嘲讽覆盖）
 *
 * 目标选择：
 *   - 原版随机 + 50%仇恨权重
 *   - 第一名始终获得10%权重加成
 *   - 触发切换目标惩罚时额外增加权重(默认1.5倍)
 *
 * ============================================================================
 * 脚本接口
 * ============================================================================
 *
 *   // 获取指定敌人的仇恨列表
 *   fnyoat.HateSystem.getEnemyHate(enemyIndex)
 *
 *   // 获取指定角色对指定敌人的仇恨
 *   fnyoat.HateSystem.getHate(enemyIndex, actorId)
 *
 *   // 设置指定角色对指定敌人的仇恨
 *   fnyoat.HateSystem.setHate(enemyIndex, actorId, value)
 *
 *   // 增加仇恨
 *   fnyoat.HateSystem.addHate(enemyIndex, actorId, value)
 *
 *   // 嘲讽指定敌人
 *   fnyoat.HateSystem.taunt(enemyIndex, actorId)
 *
 *   // 将自身仇恨复制为目标敌人仇恨列表第一名
 *   fnyoat.HateSystem.copyHateToTop(sourceActorId, targetEnemyIndex)
 *
 *   // 重置所有仇恨
 *   fnyoat.HateSystem.resetAll()
 *
 *   // 获取战斗统计(伤害/承伤/治疗)
 *   fnyoat.HateSystem.getBattleStats()
 *
 * ============================================================================
 * 插件命令
 * ============================================================================
 *   HateSystem taunt enemyIndex actorId    - 嘲讽指定敌人
 *   HateSystem copyHate sourceActorId targetEnemyIndex - 复制仇恨
 *   HateSystem reset                        - 重置仇恨
 */

declare var Imported: any;
declare var PluginManager: any;
declare var BattleManager: any;
declare var Game_Action: any;
declare var Game_Battler: any;
declare var Game_Actor: any;
declare var Game_Enemy: any;
declare var Scene_Battle: any;
declare var $gameParty: any;
declare var $gameTroop: any;

Imported = Imported || {};
Imported.fnyoat_HateSystem = true;

window.fnyoat = window.fnyoat || {};

(function(): void {
    const hateParams = PluginManager.parameters('fnyoat_HateSystem');
    const hateConfig = {
        damageHateRate: Number(hateParams['Damage Hate Rate'] || 100) / 100,
        aoeHateRate: Number(hateParams['AoE Hate Rate'] || 30) / 100,
        healHateRate: Number(hateParams['Heal Hate Rate'] || 50) / 100,
        hateDecayPerTurn: Number(hateParams['Hate Decay Per Turn'] || 5),
        tauntCatchUpRate: Number(hateParams['Taunt Catch Up Rate'] || 50) / 100,
        threatMultiplierThreshold: Number(hateParams['Threat Multiplier Threshold'] || 110) / 100,
        threatWeightBonus: Number(hateParams['Threat Weight Bonus'] || 1.5),
        hateWeightBase: Number(hateParams['Hate Weight Base'] || 50) / 100,
        firstPlaceBonus: 1 + Number(hateParams['First Place Bonus'] || 10) / 100,
        focusFireWeight: Number(hateParams['Focus Fire Weight'] || 100),
    };

    function getHateMultiplier(battler: any): number {
        if (!battler || !battler.states) return 1;
        let mult = 1;
        for (const state of battler.states()) {
            if (state && state.meta && state.meta['Hate Multiplier']) {
                const val = Number(state.meta['Hate Multiplier']) / 100;
                mult += (val - 1);
            }
        }
        return Math.max(0, mult);
    }

    function hasTauntState(battler: any): boolean {
        if (!battler || !battler.states) return false;
        for (const state of battler.states()) {
            if (state && state.meta && state.meta['Taunt State'] !== undefined) {
                return true;
            }
        }
        return false;
    }

    function getFocusFireMultiplier(battler: any): number {
        if (!battler || !battler.states) return 1;
        for (const state of battler.states()) {
            if (state && state.meta && state.meta['Focus Fire'] !== undefined) {
                return hateConfig.focusFireWeight;
            }
        }
        return 1;
    }

    function findActorById(actorId: number): any {
        const members = $gameParty.members();
        for (const member of members) {
            if (member.actorId() === actorId) return member;
        }
        return null;
    }

    interface HateEntry {
        actorId: number;
        total: number;
        damage: number;
        heal: number;
    }

    interface BattleStat {
        actorId: number;
        damageDealt: number;
        damageTaken: number;
        healingDone: number;
    }

    class HateSystem {
        private _enemyHate: Map<number, HateEntry[]>;
        private _battleStats: Map<number, BattleStat>;
        private _tauntedEnemies: Map<number, number>;
        private _threatBonus: Map<number, boolean>;
        private _previousThreatBonus: Map<number, boolean>;
        private _hasDecayedThisTurn: boolean;

        constructor() {
            this._enemyHate = new Map();
            this._battleStats = new Map();
            this._tauntedEnemies = new Map();
            this._threatBonus = new Map();
            this._previousThreatBonus = new Map();
            this._hasDecayedThisTurn = false;
        }

        initialize(): void {
            this._enemyHate.clear();
            this._battleStats.clear();
            this._tauntedEnemies.clear();
            this._threatBonus.clear();
            this._previousThreatBonus.clear();

            const enemies = $gameTroop.members();
            for (let i = 0; i < enemies.length; i++) {
                const hateList: HateEntry[] = [];
                const actors = $gameParty.members();
                for (let j = 0; j < actors.length; j++) {
                    hateList.push({
                        actorId: actors[j].actorId(),
                        total: 0,
                        damage: 0,
                        heal: 0,
                    });
                }
                this._enemyHate.set(i, hateList);
            }

            const actors = $gameParty.members();
            for (let i = 0; i < actors.length; i++) {
                this._battleStats.set(actors[i].actorId(), {
                    actorId: actors[i].actorId(),
                    damageDealt: 0,
                    damageTaken: 0,
                    healingDone: 0,
                });
            }
        }

        getEnemyHate(enemyIndex: number): HateEntry[] | null {
            return this._enemyHate.get(enemyIndex) || null;
        }

        getHate(enemyIndex: number, actorId: number): number {
            const hateList = this.getEnemyHate(enemyIndex);
            if (!hateList) return 0;
            const entry = hateList.find(e => e.actorId === actorId);
            return entry ? entry.total : 0;
        }

        setHate(enemyIndex: number, actorId: number, value: number): void {
            const hateList = this.getEnemyHate(enemyIndex);
            if (!hateList) return;
            const entry = hateList.find(e => e.actorId === actorId);
            if (entry) {
                entry.total = Math.max(0, value);
            }
        }

        addHate(enemyIndex: number, actorId: number, value: number, type: 'damage' | 'heal' = 'damage'): void {
            const hateList = this.getEnemyHate(enemyIndex);
            if (!hateList) return;
            const entry = hateList.find(e => e.actorId === actorId);
            if (entry) {
                entry.total = Math.max(0, entry.total + value);
                if (type === 'damage') {
                    entry.damage = Math.max(0, entry.damage + value);
                } else {
                    entry.heal = Math.max(0, entry.heal + value);
                }
            }
            this.checkThreatBonus(enemyIndex);
        }

        checkThreatBonus(enemyIndex: number): void {
            const hateList = this.getEnemyHate(enemyIndex);
            if (!hateList || hateList.length < 2) {
                this._previousThreatBonus.set(enemyIndex, this._threatBonus.has(enemyIndex));
                this._threatBonus.delete(enemyIndex);
                return;
            }

            const sorted = [...hateList].sort((a, b) => b.total - a.total);
            const first = sorted[0];
            const second = sorted[1];

            const previousHadBonus = this._previousThreatBonus.get(enemyIndex) || false;
            const nowHasBonus = second.total > 0 && first.total > second.total * hateConfig.threatMultiplierThreshold;

            if (nowHasBonus && !previousHadBonus) {
                this._threatBonus.set(enemyIndex, true);
            } else if (!nowHasBonus) {
                this._threatBonus.delete(enemyIndex);
            }

            this._previousThreatBonus.set(enemyIndex, nowHasBonus);
        }

        hasThreatBonus(enemyIndex: number): boolean {
            return this._threatBonus.has(enemyIndex);
        }

        decayHate(): void {
            if (this._hasDecayedThisTurn) {
                return;
            }
            this._hasDecayedThisTurn = true;
            for (const [enemyIndex, hateList] of this._enemyHate) {
                for (const entry of hateList) {
                    entry.total = Math.max(0, entry.total - hateConfig.hateDecayPerTurn);
                }
                this.checkThreatBonus(enemyIndex);
            }
        }

        resetDecayFlag(): void {
            this._hasDecayedThisTurn = false;
        }

        taunt(enemyIndex: number, actorId: number): void {
            const hateList = this.getEnemyHate(enemyIndex);
            if (hateList && hateList.length > 0) {
                const sorted = [...hateList].sort((a, b) => b.total - a.total);
                const topEntry = sorted[0];
                const actorEntry = hateList.find(e => e.actorId === actorId);
                if (actorEntry && topEntry.total > actorEntry.total) {
                    const gap = topEntry.total - actorEntry.total;
                    const catchUpAmount = Math.floor(gap * hateConfig.tauntCatchUpRate);
                    this.addHate(enemyIndex, actorId, catchUpAmount, 'damage');
                }
            }
            this._tauntedEnemies.set(enemyIndex, actorId);
        }

        isTaunted(enemyIndex: number): boolean {
            return this._tauntedEnemies.has(enemyIndex);
        }

        copyHateToTop(sourceActorId: number, targetEnemyIndex: number): void {
            const hateList = this.getEnemyHate(targetEnemyIndex);
            if (!hateList) return;

            const sorted = [...hateList].sort((a, b) => b.total - a.total);
            if (sorted.length === 0) return;

            const topEntry = sorted[0];
            const sourceEntry = hateList.find(e => e.actorId === sourceActorId);

            if (sourceEntry) {
                sourceEntry.total = topEntry.total;
                sourceEntry.damage = topEntry.damage;
                sourceEntry.heal = topEntry.heal;
                this.checkThreatBonus(targetEnemyIndex);
            }
        }

        resetAll(): void {
            this.initialize();
        }

        addDamageDealt(actorId: number, amount: number): void {
            const stat = this._battleStats.get(actorId);
            if (stat) {
                stat.damageDealt += amount;
            }
        }

        addDamageTaken(actorId: number, amount: number): void {
            const stat = this._battleStats.get(actorId);
            if (stat) {
                stat.damageTaken += amount;
            }
        }

        addHealingDone(actorId: number, amount: number): void {
            const stat = this._battleStats.get(actorId);
            if (stat) {
                stat.healingDone += amount;
            }
        }

        getBattleStats(): BattleStat[] {
            return Array.from(this._battleStats.values());
        }

        selectTargetWithHate(enemyIndex: number): number {
            const hateList = this.getEnemyHate(enemyIndex);
            if (!hateList || hateList.length === 0) return -1;

            const aliveActors = $gameParty.aliveMembers();
            if (aliveActors.length === 0) return -1;

            const hateListFiltered = hateList.filter(e => 
                aliveActors.some(a => a.actorId() === e.actorId)
            );

            if (hateListFiltered.length === 0) return -1;

            for (const actor of aliveActors) {
                if (hasTauntState(actor)) {
                    return $gameParty.aliveMembers().indexOf(actor);
                }
            }

            if (this.isTaunted(enemyIndex)) {
                const tauntActorId = this._tauntedEnemies.get(enemyIndex);
                const actor = aliveActors.find(a => a.actorId() === tauntActorId);
                if (actor) return $gameParty.aliveMembers().indexOf(actor);
            }

            const totalHate = hateListFiltered.reduce((sum, e) => sum + e.total, 0);
            const hasThreatBonus = this.hasThreatBonus(enemyIndex);
            const sortedList = [...hateListFiltered].sort((a, b) => b.total - a.total);
            const firstActorId = sortedList.length > 0 ? sortedList[0].actorId : -1;

            if (totalHate > 0) {
                let weightSum = 0;
                const weights: { actorId: number; weight: number }[] = [];

                for (const entry of hateListFiltered) {
                    let hateWeight = entry.total;

                    if (entry.actorId === firstActorId) {
                        hateWeight *= hateConfig.firstPlaceBonus;
                    }

                    if (hasThreatBonus && entry.actorId === firstActorId) {
                        hateWeight *= hateConfig.threatWeightBonus;
                    }

                    const actor = aliveActors.find(a => a.actorId() === entry.actorId);
                    if (actor) {
                        hateWeight *= getFocusFireMultiplier(actor);
                    }

                    const randomWeight = Math.random() * 100;
                    const combinedWeight = hateWeight * hateConfig.hateWeightBase + randomWeight * (1 - hateConfig.hateWeightBase);

                    weights.push({ actorId: entry.actorId, weight: combinedWeight });
                    weightSum += combinedWeight;
                }

                let random = Math.random() * weightSum;
                for (const w of weights) {
                    random -= w.weight;
                    if (random <= 0) {
                        const actor = aliveActors.find(a => a.actorId() === w.actorId);
                        if (actor) return $gameParty.aliveMembers().indexOf(actor);
                    }
                }
            }

            return Math.floor(Math.random() * aliveActors.length);
        }
    }

    const hateSystem = new HateSystem();
    (window as any).fnyoat.HateSystem = {
        getEnemyHate: (enemyIndex: number) => hateSystem.getEnemyHate(enemyIndex),
        getHate: (enemyIndex: number, actorId: number) => hateSystem.getHate(enemyIndex, actorId),
        setHate: (enemyIndex: number, actorId: number, value: number) => hateSystem.setHate(enemyIndex, actorId, value),
        addHate: (enemyIndex: number, actorId: number, value: number, type?: 'damage' | 'heal') => hateSystem.addHate(enemyIndex, actorId, value, type),
        taunt: (enemyIndex: number, actorId: number) => hateSystem.taunt(enemyIndex, actorId),
        isTaunted: (enemyIndex: number) => hateSystem.isTaunted(enemyIndex),
        copyHateToTop: (sourceActorId: number, targetEnemyIndex: number) => hateSystem.copyHateToTop(sourceActorId, targetEnemyIndex),
        resetAll: () => hateSystem.resetAll(),
        getBattleStats: () => hateSystem.getBattleStats(),
        selectTargetWithHate: (enemyIndex: number) => hateSystem.selectTargetWithHate(enemyIndex),
        decayHate: () => hateSystem.decayHate(),
        _system: hateSystem,
    };

    const _Hate_Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target: any): void {
        _Hate_Game_Action_apply.call(this, target);

        const result = target.result();
        if (!result) return;

        const subject = this.subject();
        if (!subject || !subject.isActor()) return;

        const actorId = subject.actorId();
        const hateMult = getHateMultiplier(subject);

        if (result.hpDamage > 0) {
            const damage = result.hpDamage;

            hateSystem.addDamageDealt(actorId, damage);

            const enemyIndex = $gameTroop.members().indexOf(target);
            if (enemyIndex >= 0) {
                hateSystem.addHate(enemyIndex, actorId, Math.floor(damage * hateConfig.damageHateRate * hateMult), 'damage');
            }

            const allEnemies = $gameTroop.aliveMembers();
            for (let i = 0; i < allEnemies.length; i++) {
                const enemy = allEnemies[i];
                if (enemy !== target) {
                    const idx = $gameTroop.members().indexOf(enemy);
                    if (idx >= 0) {
                        hateSystem.addHate(idx, actorId, Math.floor(damage * hateConfig.aoeHateRate * hateMult), 'damage');
                    }
                }
            }
        }

        if (result.hpDamage < 0 && target.isActor()) {
            const healAmount = Math.abs(result.hpDamage);
            hateSystem.addHealingDone(actorId, healAmount);

            const enemyCount = $gameTroop.aliveMembers().length;
            if (enemyCount > 0) {
                const healHate = Math.floor(healAmount * hateConfig.healHateRate * hateMult / enemyCount);
                const allEnemies = $gameTroop.aliveMembers();
                for (let i = 0; i < allEnemies.length; i++) {
                    const idx = $gameTroop.members().indexOf(allEnemies[i]);
                    if (idx >= 0) {
                        hateSystem.addHate(idx, actorId, healHate, 'heal');
                    }
                }
            }
        }

        const item = this.item();
        if (item) {
            const itemMeta = item.meta || {};
            const isHit = result.isHit();
            const hitIndependent = itemMeta['Hit Independent'] !== undefined;
            const isSelfTarget = target && subject && target === subject;

            if (isHit || hitIndependent) {
                const applyToAllEnemies = (fn: (idx: number) => void) => {
                    const allEnemies = $gameTroop.aliveMembers();
                    for (const enemy of allEnemies) {
                        const idx = $gameTroop.members().indexOf(enemy);
                        if (idx >= 0) fn(idx);
                    }
                };

                if (itemMeta['Hate Bonus']) {
                    const bonusHate = Math.floor(Number(itemMeta['Hate Bonus']) * hateMult);
                    if (bonusHate !== 0) {
                        if (isSelfTarget) {
                            applyToAllEnemies((idx) => {
                                hateSystem.addHate(idx, actorId, bonusHate, 'damage');
                            });
                        } else if (target && target.isEnemy()) {
                            const enemyIndex = $gameTroop.members().indexOf(target);
                            if (enemyIndex >= 0) {
                                hateSystem.addHate(enemyIndex, actorId, bonusHate, 'damage');
                            }
                        }
                    }
                }

                if (itemMeta['Taunt'] !== undefined) {
                    if (isSelfTarget) {
                        applyToAllEnemies((idx) => {
                            hateSystem.taunt(idx, actorId);
                        });
                    } else if (target && target.isEnemy()) {
                        const enemyIndex = $gameTroop.members().indexOf(target);
                        if (enemyIndex >= 0) {
                            hateSystem.taunt(enemyIndex, actorId);
                        }
                    }
                }
            }
        }
    };

    const _Hate_Game_Action_executeHpDamage = (Game_Action.prototype as any).executeHpDamage;
    (Game_Action.prototype as any).executeHpDamage = function(target: any, value: number): void {
        _Hate_Game_Action_executeHpDamage.call(this, target, value);

        if (value > 0 && target && target.isActor()) {
            const actorId = target.actorId();
            hateSystem.addDamageTaken(actorId, value);
        }
    };

    const _Hate_Game_Battler_addState = Game_Battler.prototype.addState;
    Game_Battler.prototype.addState = function(stateId: number): void {
        const action = BattleManager._action;
        const subject = action ? action.subject() : null;
        if (subject && subject.isActor()) {
            if (!this._stateCasters) this._stateCasters = {};
            this._stateCasters[stateId] = subject.actorId();
        }
        _Hate_Game_Battler_addState.call(this, stateId);
    };

    const _Hate_Game_Battler_removeState = Game_Battler.prototype.removeState;
    Game_Battler.prototype.removeState = function(stateId: number): void {
        if (this._stateCasters) {
            delete this._stateCasters[stateId];
        }
        _Hate_Game_Battler_removeState.call(this, stateId);
    };

    const _Hate_Game_Battler_gainHp = Game_Battler.prototype.gainHp;
    Game_Battler.prototype.gainHp = function(value: number): void {
        const prevHp = this.hp;
        _Hate_Game_Battler_gainHp.call(this, value);
        
        if ($gameParty.inBattle()) {
            if (value > 0 && this.isActor()) {
                let actorId = null;
                const states = this.states();
                for (const state of states) {
                    if (state.id && this._stateCasters && this._stateCasters[state.id]) {
                        actorId = this._stateCasters[state.id];
                        break;
                    }
                }
                if (actorId) {
                    const caster = findActorById(actorId);
                    const hateMult = getHateMultiplier(caster);
                    const actualHeal = Math.min(value, this.mhp - prevHp);
                    hateSystem.addHealingDone(actorId, actualHeal);
                    
                    const enemyCount = $gameTroop.aliveMembers().length;
                    if (enemyCount > 0) {
                        const healHate = Math.floor(actualHeal * hateConfig.healHateRate * hateMult / enemyCount);
                        const allEnemies = $gameTroop.aliveMembers();
                        for (let i = 0; i < allEnemies.length; i++) {
                            const idx = $gameTroop.members().indexOf(allEnemies[i]);
                            if (idx >= 0) {
                                hateSystem.addHate(idx, actorId, healHate, 'heal');
                            }
                        }
                    }
                }
            } else if (value < 0 && this.isEnemy()) {
                const damage = Math.abs(value);
                let actorId = null;
                const states = this.states();
                for (const state of states) {
                    if (state.id && this._stateCasters && this._stateCasters[state.id]) {
                        actorId = this._stateCasters[state.id];
                        break;
                    }
                }
                if (actorId) {
                    const caster = findActorById(actorId);
                    const hateMult = getHateMultiplier(caster);
                    hateSystem.addDamageDealt(actorId, damage);
                    
                    const enemyIndex = $gameTroop.members().indexOf(this);
                    if (enemyIndex >= 0) {
                        hateSystem.addHate(enemyIndex, actorId, Math.floor(damage * hateConfig.damageHateRate * hateMult), 'damage');
                    }
                    
                    const allEnemies = $gameTroop.aliveMembers();
                    for (let i = 0; i < allEnemies.length; i++) {
                        const enemy = allEnemies[i];
                        if (enemy !== this) {
                            const idx = $gameTroop.members().indexOf(enemy);
                            if (idx >= 0) {
                                hateSystem.addHate(idx, actorId, Math.floor(damage * hateConfig.aoeHateRate * hateMult), 'damage');
                            }
                        }
                    }
                }
            }
        }
    };

    const _Hate_Game_Action_targetsForOpponents = Game_Action.prototype.targetsForOpponents;
    Game_Action.prototype.targetsForOpponents = function(): any[] {
        const subject = this.subject();
        if (subject && subject.isEnemy()) {
            const enemyIndex = $gameTroop.members().indexOf(subject);
            if (enemyIndex >= 0 && this.isForOne()) {
                const targetIndex = hateSystem.selectTargetWithHate(enemyIndex);
                if (targetIndex >= 0) {
                    const unit = this.opponentsUnit();
                    const alive = unit.aliveMembers();
                    if (alive[targetIndex]) {
                        return [alive[targetIndex]];
                    }
                }
            }
        }
        return _Hate_Game_Action_targetsForOpponents.call(this);
    };

    const _Hate_BattleManager_startBattle = BattleManager.startBattle;
    BattleManager.startBattle = function(): void {
        _Hate_BattleManager_startBattle.call(this);
        hateSystem.initialize();
    };

    const _Hate_BattleManager_endBattle = BattleManager.endBattle;
    BattleManager.endBattle = function(): void {
        _Hate_BattleManager_endBattle.call(this);
        hateSystem.resetAll();
    };

    const _Hate_BattleManager_startTurn = BattleManager.startTurn;
    BattleManager.startTurn = function(): void {
        hateSystem.resetDecayFlag();
        _Hate_BattleManager_startTurn.call(this);
    };

    const _Hate_BattleManager_endTurn = BattleManager.endTurn;
    BattleManager.endTurn = function(): void {
        hateSystem.decayHate();

        const aliveActors = $gameParty.aliveMembers();
        for (const actor of aliveActors) {
            if (actor.states) {
                for (const state of actor.states()) {
                    if (state && state.meta && state.meta['Hate Per Turn']) {
                        const hatePerTurn = Number(state.meta['Hate Per Turn']);
                        if (hatePerTurn > 0) {
                            const allEnemies = $gameTroop.aliveMembers();
                            for (const enemy of allEnemies) {
                                const idx = $gameTroop.members().indexOf(enemy);
                                if (idx >= 0) {
                                    hateSystem.addHate(idx, actor.actorId(), hatePerTurn, 'damage');
                                }
                            }
                        }
                    }
                }
            }
        }

        _Hate_BattleManager_endTurn.call(this);
    };

    const _Hate_Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command: string, args: string[]): void {
        _Hate_Game_Interpreter_pluginCommand.call(this, command, args);

        if (command.toLowerCase() === 'hatesystem') {
            const subCommand = (args[0] || '').toLowerCase();
            switch (subCommand) {
                case 'taunt': {
                    const enemyIndex = parseInt(args[1]) || 0;
                    const actorId = parseInt(args[2]) || $gameParty.leader().actorId();
                    hateSystem.taunt(enemyIndex, actorId);
                    break;
                }
                case 'copyhate': {
                    const sourceActorId = parseInt(args[1]) || $gameParty.leader().actorId();
                    const targetEnemyIndex = parseInt(args[2]) || 0;
                    hateSystem.copyHateToTop(sourceActorId, targetEnemyIndex);
                    break;
                }
                case 'reset': {
                    hateSystem.resetAll();
                    break;
                }
            }
        }
    };
})();