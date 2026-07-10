//=============================================================================
// fnyoat_BattleFX.ts
//=============================================================================

/*:
 * @plugindesc [战斗美化] 战斗特效与虚拟血条系统
 * @author fnyoat
 *
 * @param ---缓动设置---
 * @default
 *
 * @param Easing Duration
 * @text 缓动时长(帧)
 * @type number
 * @default 15
 * @desc 数据条从旧值过渡到新值所需的帧数，越大越慢
 *
 * @param Easing Factor
 * @text 缓动系数
 * @type number
 * @default 0.2
 * @desc 每帧的插值比例，0-1之间，越大越快
 *
 * @param ---虚拟血条设置---
 * @default
 *
 * @param Enable Virtual Bar
 * @text 启用虚拟血条
 * @type boolean
 * @default true
 * @desc 是否启用战斗单位上方的虚拟血条显示
 *
 * @param Show Mode
 * @text 显示模式
 * @type combo
 * @option always
 * @option select
 * @desc always:始终显示 select:选中或受伤时显示
 * @default always
 *
 * @param Show Position
 * @text 显示位置
 * @type combo
 * @option up
 * @option center
 * @option down
 * @desc 血条相对于角色图片的位置
 * @default up
 *
 * @param Offset X
 * @text 偏移X
 * @type number
 * @default 0
 * @desc 血条整体偏移X
 *
 * @param Offset Y
 * @text 偏移Y
 * @type number
 * @default -32
 * @desc 血条整体偏移Y
 *
 * @param Fade Frames
 * @text 渐入渐出帧数
 * @type number
 * @default 30
 * @desc 血条从透明到不透明的过渡帧数
 *
 * @param Bar Width
 * @text 条组宽度
 * @type number
 * @default 140
 * @desc 血条/蓝条/TP条的宽度
 *
 * @param Bar Height
 * @text 条组高度
 * @type number
 * @default 12
 * @desc 血条/蓝条/TP条的高度
 *
 * @param Deep Speed
 * @text 深层条速度%
 * @type number
 * @default 20
 * @desc 第二层动态条的追赶速度百分比
 *
 * @param Deep Min Distance
 * @text 深层条最小距离
 * @type number
 * @default 0.1
 * @desc 深层条与前层条视为相同的最小距离
 *
 * @param ---名称显示---
 * @default
 *
 * @param ---跳字特效---
 * @default
 *
 * @param Crit Scale Peak
 * @text 暴击缩放峰值
 * @type number
 * @default 1.8
 * @desc 暴击跳字放大到的最大倍数
 *
 * @param Crit Scale Up Frames
 * @text 暴击放大帧数
 * @type number
 * @default 12
 * @desc 暴击跳字从1倍加速放大到峰值的帧数(0.2秒)
 *
 * @param Crit Scale Down Frames
 * @text 暴击缩小帧数
 * @type number
 * @default 12
 * @desc 暴击跳字从峰值缓慢回落至最终大小的帧数(0.2秒)
 *
 * @param Crit Final Scale
 * @text 暴击最终大小
 * @type number
 * @default 1.1
 * @desc 暴击跳字回落后保持的大小倍数
 *
 * @param Show Name
 * @text 显示名称
 * @type boolean
 * @default true
 * @desc 是否显示角色/敌人名称
 *
 * @param Name Font Size
 * @text 名称字体大小
 * @type number
 * @default 18
 * @desc 名称文字大小
 *
 * @param Name Color
 * @text 名称颜色
 * @type text
 * @default #ffffff
 * @desc 名称文字颜色
 *
 * @param Name Outline Size
 * @text 名称描边宽度
 * @type number
 * @default 2
 * @desc 名称描边宽度
 *
 * @param Name Outline Color
 * @text 名称描边颜色
 * @type text
 * @default rgba(0,0,0,0.7)
 * @desc 名称描边颜色
 *
 * @param Name Offset Y
 * @text 名称偏移Y
 * @type number
 * @default -20
 * @desc 名称相对于血条的垂直偏移
 *
 * @param ---HP条设置---
 * @default
 *
 * @param Show HP
 * @text 显示HP条
 * @type boolean
 * @default true
 * @desc 是否显示HP条
 *
 * @param HP Top Color
 * @text HP前层颜色
 * @type text
 * @default #ff6b6b
 * @desc HP条前层颜色
 *
 * @param HP Deep Color
 * @text HP深层颜色
 * @type text
 * @default #ee5a5a
 * @desc HP条深层动态颜色
 *
 * @param HP Background Color
 * @text HP背景颜色
 * @type text
 * @default rgba(50,50,50,0.8)
 * @desc HP条背景颜色
 *
 * @param HP Border Color
 * @text HP边框颜色
 * @type text
 * @default rgba(0,0,0,0.6)
 * @desc HP条边框颜色
 *
 * @param HP Info Mode
 * @text HP信息模式
 * @type combo
 * @option none
 * @option value
 * @option percent
 * @desc 是否显示HP数值/百分比
 * @default value
 *
 * @param HP Font Size
 * @text HP字体大小
 * @type number
 * @default 12
 * @desc HP数值字体大小
 *
 * @param HP Offset Y
 * @text HP偏移Y
 * @type number
 * @default 0
 * @desc HP条相对于整体位置的垂直偏移
 *
 * @param ---MP条设置---
 * @default
 *
 * @param Show MP
 * @text 显示MP条
 * @type boolean
 * @default true
 * @desc 是否显示MP条
 *
 * @param MP Top Color
 * @text MP前层颜色
 * @type text
 * @default #4ecdc4
 * @desc MP条前层颜色
 *
 * @param MP Deep Color
 * @text MP深层颜色
 * @type text
 * @default #3db8b0
 * @desc MP条深层动态颜色
 *
 * @param MP Background Color
 * @text MP背景颜色
 * @type text
 * @default rgba(50,50,50,0.8)
 * @desc MP条背景颜色
 *
 * @param MP Border Color
 * @text MP边框颜色
 * @type text
 * @default rgba(0,0,0,0.6)
 * @desc MP边框颜色
 *
 * @param MP Info Mode
 * @text MP信息模式
 * @type combo
 * @option none
 * @option value
 * @option percent
 * @desc 是否显示MP数值/百分比
 * @default value
 *
 * @param MP Font Size
 * @text MP字体大小
 * @type number
 * @default 10
 * @desc MP数值字体大小
 *
 * @param MP Offset Y
 * @text MP偏移Y
 * @type number
 * @default 16
 * @desc MP条相对于HP条的垂直偏移
 *
 * @param ---TP条设置---
 * @default
 *
 * @param Show TP
 * @text 显示TP条
 * @type boolean
 * @default true
 * @desc 是否显示TP条
 *
 * @param TP Top Color
 * @text TP前层颜色
 * @type text
 * @default #a855f7
 * @desc TP条前层颜色
 *
 * @param TP Deep Color
 * @text TP深层颜色
 * @type text
 * @default #9333ea
 * @desc TP条深层动态颜色
 *
 * @param TP Background Color
 * @text TP背景颜色
 * @type text
 * @default rgba(50,50,50,0.8)
 * @desc TP条背景颜色
 *
 * @param TP Border Color
 * @text TP边框颜色
 * @type text
 * @default rgba(0,0,0,0.6)
 * @desc TP边框颜色
 *
 * @param TP Info Mode
 * @text TP信息模式
 * @type combo
 * @option none
 * @option value
 * @option percent
 * @desc 是否显示TP数值/百分比
 * @default none
 *
 * @param TP Font Size
 * @text TP字体大小
 * @type number
 * @default 10
 * @desc TP数值字体大小
 *
 * @param TP Offset Y
 * @text TP偏移Y
 * @type number
 * @default 32
 * @desc TP条相对于HP条的垂直偏移
 *
 * @help
 * ============================================================================
 * 战斗美化说明
 * ============================================================================
 *
 * 本插件统一管理战斗中所有跳字及特效显示，包括：
 *
 * 一、伤害跳字显示：
 *   - 普通伤害/恢复跳字
 *   - 暴击(Critical)跳字 —— 带缩放弹跳动效
 *   - 格挡(Block)跳字显示
 *   - 招架(Parry)跳字显示
 *   - 偏折(Deflect)跳字显示
 *   - MP/TP伤害跳字（保留原版逻辑）
 *
 * 二、暴击跳字动效：
 *   - 先迅速放大(EaseIn)，再缩放回落(EaseOut)
 *   - 可调节参数：缩放峰值、放大帧数、缩小帧数
 *
 * 三、数据条缓动：
 *   - HP条受伤/恢复时平滑过渡
 *   - MP条消耗/恢复时平滑过渡
 *   - TP条累积/消耗时平滑过渡
 *   - 仅在战斗中生效
 *
 * 四、虚拟血条：
 *   - 在战斗单位上方显示HP/MP/TP条
 *   - 三层条组（前层、深层动态、底层背景）
 *   - 渐入渐出动画
 *   - 名称和数值显示
 *
 * 依赖：
 *   - fnyoat_HitCore (命中核心插件)
 *
 * 显示规则：
 *   - 格挡/招架且伤害为0：显示 "Block" 或 "Parry"
 *   - 格挡/招架且有伤害：显示伤害数字
 *   - 暴击伤害：跳字带缩放弹跳效果
 *
 */

declare var Imported: any;
declare var PluginManager: any;
declare var BattleManager: any;
declare var Scene_Battle: any;
declare var $gameParty: any;
declare var $gameTroop: any;
declare var $dataEnemies: any;
declare var $dataActors: any;
declare var Graphics: any;

Imported = Imported || {};
Imported.fnyoat_BattleFX = true;

window.fnyoat = window.fnyoat || {};

(function() {
    const params = PluginManager.parameters('fnyoat_BattleFX');
    
    const config = {
        easing: {
            duration: Number(params['Easing Duration']) || 15,
            factor: Number(params['Easing Factor']) || 0.2,
        },
        virtualBar: {
            enabled: params['Enable Virtual Bar'] !== 'false',
            showMode: params['Show Mode'] || 'always',
            showPos: params['Show Position'] || 'up',
            offsetX: Number(params['Offset X']) || 0,
            offsetY: Number(params['Offset Y']) || 0,
            fadeFrames: Number(params['Fade Frames']) || 30,
            barWidth: Number(params['Bar Width']) || 140,
            barHeight: Number(params['Bar Height']) || 12,
            deepSpeed: Number(params['Deep Speed']) || 20,
            deepMinDist: Number(params['Deep Min Distance']) || 0.1,
        },
        name: {
            show: params['Show Name'] !== 'false',
            fontSize: Number(params['Name Font Size']) || 18,
            color: params['Name Color'] || '#ffffff',
            outlineSize: Number(params['Name Outline Size']) || 2,
            outlineColor: params['Name Outline Color'] || 'rgba(0,0,0,0.7)',
            offsetY: Number(params['Name Offset Y']) || -20,
        },
        hp: {
            show: params['Show HP'] !== 'false',
            topColor: params['HP Top Color'] || '#ff8fa3',
            deepColor: params['HP Deep Color'] || '#c94c6b',
            bgColor: params['HP Background Color'] || 'rgba(50,50,50,0.8)',
            borderColor: params['HP Border Color'] || 'rgba(0,0,0,0.6)',
            infoMode: params['HP Info Mode'] || 'value',
            fontSize: Number(params['HP Font Size']) || 12,
            offsetY: Number(params['HP Offset Y']) || 0,
        },
        mp: {
            show: params['Show MP'] !== 'false',
            topColor: params['MP Top Color'] || '#4ecdc4',
            deepColor: params['MP Deep Color'] || '#3db8b0',
            bgColor: params['MP Background Color'] || 'rgba(50,50,50,0.8)',
            borderColor: params['MP Border Color'] || 'rgba(0,0,0,0.6)',
            infoMode: params['MP Info Mode'] || 'value',
            fontSize: Number(params['MP Font Size']) || 10,
            offsetY: Number(params['MP Offset Y']) || 16,
        },
        tp: {
            show: params['Show TP'] !== 'false',
            topColor: params['TP Top Color'] || '#a855f7',
            deepColor: params['TP Deep Color'] || '#9333ea',
            bgColor: params['TP Background Color'] || 'rgba(50,50,50,0.8)',
            borderColor: params['TP Border Color'] || 'rgba(0,0,0,0.6)',
            infoMode: params['TP Info Mode'] || 'none',
            fontSize: Number(params['TP Font Size']) || 10,
            offsetY: Number(params['TP Offset Y']) || 32,
        },
        crit: {
            scalePeak: Number(params['Crit Scale Peak']) || 1.8,
            scaleUpFrames: Number(params['Crit Scale Up Frames']) || 12,
            scaleDownFrames: Number(params['Crit Scale Down Frames']) || 12,
            finalScale: Number(params['Crit Final Scale']) || 1.1,
        },
    };

    const _BattleFX_Game_Battler_initialize = Game_Battler.prototype.initialize;
    Game_Battler.prototype.initialize = function(): void {
        _BattleFX_Game_Battler_initialize.call(this);
        this._displayHp = this.hp;
        this._displayMp = this.mp;
        this._displayTp = this.tp;
        this._deepDisplayHp = this.hp;
        this._deepDisplayMp = this.mp;
        this._deepDisplayTp = this.tp;
        this._lastHp = this.hp;
        this._lastMp = this.mp;
        this._lastTp = this.tp;
        this._vgfNeedRefresh = false;
        this._battleSprite = null;
    };

    Game_Battler.prototype.setBattleSprite = function(sprite: any): void {
        this._battleSprite = sprite;
    };

    Game_Battler.prototype.getBattleSprite = function(): any {
        return this._battleSprite;
    };

    // Sync display values when the battler is (re)set up or battle starts,
    // so the bar reflects the real HP immediately instead of easing from 0.
    const _BattleFX_Game_Battler_onBattleStart = Game_Battler.prototype.onBattleStart;
    Game_Battler.prototype.onBattleStart = function(): void {
        _BattleFX_Game_Battler_onBattleStart.call(this);
        this._displayHp = this.hp;
        this._displayMp = this.mp;
        this._displayTp = this.tp;
        this._deepDisplayHp = this.hp;
        this._deepDisplayMp = this.mp;
        this._deepDisplayTp = this.tp;
        this._lastHp = this.hp;
        this._lastMp = this.mp;
        this._lastTp = this.tp;
    };

    // Clean up _battleSprite when battle ends, so that JsonEx.makeDeepCopy
    // on the actor doesn't try to serialize the entire PIXI display tree
    // (which contains objects with constructor === undefined).
    const _BattleFX_Game_Battler_onBattleEnd = Game_Battler.prototype.onBattleEnd;
    Game_Battler.prototype.onBattleEnd = function(): void {
        this._battleSprite = null;
        _BattleFX_Game_Battler_onBattleEnd.call(this);
    };

    // Easing helper: runs every battle frame to animate display/deep values.
    // Hooked on Scene_Battle.update, NOT BattleManager.update, because the
    // latter is guarded by isAnyInputWindowActive() and pauses during the
    // player's action-selection phase.
    const easeBattler = (b: any): void => {
        if (!b) return;
        // ensure initialized (enemy hp is set after Game_Battler.initialize)
        if (b._displayHp === undefined || b._displayHp === 0 && b.hp > 0) {
            b._displayHp = b.hp;
        }
        if (b._displayMp === undefined || b._displayMp === 0 && b.mp > 0) {
            b._displayMp = b.mp;
        }
        if (b._displayTp === undefined) {
            b._displayTp = b.tp;
        }
        if (b._deepDisplayHp === undefined || b._deepDisplayHp === 0 && b.hp > 0) {
            b._deepDisplayHp = b.hp;
        }
        if (b._deepDisplayMp === undefined || b._deepDisplayMp === 0 && b.mp > 0) {
            b._deepDisplayMp = b.mp;
        }
        if (b._deepDisplayTp === undefined) {
            b._deepDisplayTp = b.tp;
        }
        if (b._lastHp === undefined) b._lastHp = b.hp;
        if (b._lastMp === undefined) b._lastMp = b.mp;
        if (b._lastTp === undefined) b._lastTp = b.tp;

        const deepSpeed = config.virtualBar.deepSpeed / 1000 * 1.5;
        
        b._displayHp += (b.hp - b._displayHp) * config.easing.factor * 1.5;
        b._displayMp += (b.mp - b._displayMp) * config.easing.factor * 1.5;
        b._displayTp += (b.tp - b._displayTp) * config.easing.factor * 1.5;
        
        b._deepDisplayHp += (b.hp - b._deepDisplayHp) * deepSpeed;
        b._deepDisplayMp += (b.mp - b._deepDisplayMp) * deepSpeed;
        b._deepDisplayTp += (b.tp - b._deepDisplayTp) * deepSpeed;
        
        if (Math.abs(b.hp - b._displayHp) < 0.75) b._displayHp = b.hp;
        if (Math.abs(b.mp - b._displayMp) < 0.75) b._displayMp = b.mp;
        if (Math.abs(b.tp - b._displayTp) < 0.75) b._displayTp = b.tp;
        
        if (Math.abs(b.hp - b._deepDisplayHp) < 0.75) b._deepDisplayHp = b.hp;
        if (Math.abs(b.mp - b._deepDisplayMp) < 0.75) b._deepDisplayMp = b.mp;
        if (Math.abs(b.tp - b._deepDisplayTp) < 0.75) b._deepDisplayTp = b.tp;

        const hpChanged = b.hp !== b._lastHp;
        const mpChanged = b.mp !== b._lastMp;
        const tpChanged = b.tp !== b._lastTp;
        const hpEasing = Math.abs(b._displayHp - b._deepDisplayHp) > 0.5;
        const mpEasing = Math.abs(b._displayMp - b._deepDisplayMp) > 0.5;
        const tpEasing = Math.abs(b._displayTp - b._deepDisplayTp) > 0.5;
        
        if (hpChanged || mpChanged || tpChanged || hpEasing || mpEasing || tpEasing) {
            b._vgfNeedRefresh = true;
        }
        
        if (hpChanged) b._lastHp = b.hp;
        if (mpChanged) b._lastMp = b.mp;
        if (tpChanged) b._lastTp = b.tp;
    };

    // Drive easing from Scene_Battle.update — this runs unconditionally
    // every frame while the battle scene is active (including during the
    // player's action-selection phase).
    const _BattleFX_Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function(): void {
        _BattleFX_Scene_Battle_update.call(this);
        if ($gameParty.inBattle()) {
            $gameParty.battleMembers().forEach(easeBattler);
            $gameTroop.members().forEach(easeBattler);
        }
    };

    Game_Battler.prototype.displayHp = function(): number {
        if (this._displayHp === 0 && this.hp > 0) {
            this._displayHp = this.hp;
        }
        var val = Math.round(this._displayHp);
        return Number.isFinite(val) ? val : this.hp;
    };

    Game_Battler.prototype.displayMp = function(): number {
        var val = Math.round(this._displayMp);
        return Number.isFinite(val) ? val : this.mp;
    };

    Game_Battler.prototype.displayTp = function(): number {
        var val = Math.round(this._displayTp);
        return Number.isFinite(val) ? val : this.tp;
    };

    Game_Battler.prototype.displayHpRate = function(): number {
        if (this.mhp <= 0) return 0;
        var val = this.displayHp() / this.mhp;
        return Number.isFinite(val) ? Math.max(0, Math.min(1, val)) : 0;
    };

    Game_Battler.prototype.displayMpRate = function(): number {
        if (this.mmp <= 0) return 0;
        var val = this.displayMp() / this.mmp;
        return Number.isFinite(val) ? Math.max(0, Math.min(1, val)) : 0;
    };

    Game_Battler.prototype.displayTpRate = function(): number {
        var val = this.displayTp() / 100;
        return Number.isFinite(val) ? Math.max(0, Math.min(1, val)) : 0;
    };

    // Inject the deep trailing gap *inside* drawGauge so it lands between
    // the gauge gradient and the text drawn immediately after in drawActorHp.
    const _BattleFX_Window_Base_drawGauge = (Window_Base.prototype as any).drawGauge;
    (Window_Base.prototype as any).drawGauge = function(dx: number, dy: number, dw: number, rate: number, color1: string, color2: string): void {
        _BattleFX_Window_Base_drawGauge.call(this, dx, dy, dw, rate, color1, color2);
        if (this._deepGapInfo) {
            const info = this._deepGapInfo;
            const gapW = info.deepFillW - info.displayFillW;
            if (gapW > 0) {
                this.contents.fillRect(info.x + info.displayFillW, info.gaugeY, gapW, info.gaugeH, info.color);
                this.contents.fillRect(info.x + info.displayFillW, info.gaugeY, gapW, info.gaugeH, 'rgba(0,0,0,0.5)');
            }
            this._deepGapInfo = null;
        }
    };

    const _BattleFX_Window_Base_drawActorHp = (Window_Base.prototype as any).drawActorHp;
    (Window_Base.prototype as any).drawActorHp = function(actor: any, x: number, y: number, width: number): void {
        const deepHpRate = actor._deepDisplayHp !== undefined ? Math.max(0, Math.min(1, actor._deepDisplayHp / actor.mhp)) : actor.hpRate();
        const displayHpRate = actor.displayHpRate();
        
        // Stash deep-gap info so the drawGauge hook can paint it between the
        // gauge background/gradient and the label text.
        if (deepHpRate > displayHpRate + 0.005) {
            const gaugeH = this.gaugeHeight ? this.gaugeHeight() : 6;
            const gaugeY = y + this.lineHeight() - gaugeH - 2;
            const displayFillW = Math.floor(Math.max(0, Math.min(width, width * displayHpRate)));
            const deepFillW = Math.floor(Math.max(0, Math.min(width, width * deepHpRate)));
            this._deepGapInfo = {
                x, gaugeY, displayFillW, deepFillW, gaugeH,
                color: this.hpGaugeColor1()
            };
        }
        
        const originalHpRate = actor.hpRate.bind(actor);
        const originalHp = actor._hp;
        
        actor.hpRate = function(): number { return displayHpRate; };
        actor._hp = actor.displayHp();
        // drawGauge (with deep-gap injection) runs, then text on top.
        _BattleFX_Window_Base_drawActorHp.call(this, actor, x, y, width);
        
        actor.hpRate = originalHpRate;
        actor._hp = originalHp;
    };

    const _BattleFX_Window_Base_drawActorMp = (Window_Base.prototype as any).drawActorMp;
    (Window_Base.prototype as any).drawActorMp = function(actor: any, x: number, y: number, width: number): void {
        const deepMpRate = actor._deepDisplayMp !== undefined ? Math.max(0, Math.min(1, actor._deepDisplayMp / actor.mmp)) : actor.mpRate();
        const displayMpRate = actor.displayMpRate();
        
        if (deepMpRate > displayMpRate + 0.005) {
            const gaugeH = this.gaugeHeight ? this.gaugeHeight() : 6;
            const gaugeY = y + this.lineHeight() - gaugeH - 2;
            const displayFillW = Math.floor(Math.max(0, Math.min(width, width * displayMpRate)));
            const deepFillW = Math.floor(Math.max(0, Math.min(width, width * deepMpRate)));
            this._deepGapInfo = {
                x, gaugeY, displayFillW, deepFillW, gaugeH,
                color: this.mpGaugeColor1()
            };
        }
        
        const originalMpRate = actor.mpRate.bind(actor);
        const originalMp = actor._mp;
        
        actor.mpRate = function(): number { return displayMpRate; };
        actor._mp = actor.displayMp();
        _BattleFX_Window_Base_drawActorMp.call(this, actor, x, y, width);
        
        actor.mpRate = originalMpRate;
        actor._mp = originalMp;
    };

    const _BattleFX_Window_Base_drawActorTp = (Window_Base.prototype as any).drawActorTp;
    (Window_Base.prototype as any).drawActorTp = function(actor: any, x: number, y: number, width: number): void {
        const deepTpRate = actor._deepDisplayTp !== undefined ? Math.max(0, Math.min(1, actor._deepDisplayTp / 100)) : actor.tpRate();
        const displayTpRate = actor.displayTpRate();
        
        if (deepTpRate > displayTpRate + 0.005) {
            const gaugeH = this.gaugeHeight ? this.gaugeHeight() : 6;
            const gaugeY = y + this.lineHeight() - gaugeH - 2;
            const displayFillW = Math.floor(Math.max(0, Math.min(width, width * displayTpRate)));
            const deepFillW = Math.floor(Math.max(0, Math.min(width, width * deepTpRate)));
            this._deepGapInfo = {
                x, gaugeY, displayFillW, deepFillW, gaugeH,
                color: this.tpGaugeColor1()
            };
        }
        
        const originalTpRate = actor.tpRate.bind(actor);
        const originalTp = actor._tp;
        
        actor.tpRate = function(): number { return displayTpRate; };
        actor._tp = actor.displayTp();
        _BattleFX_Window_Base_drawActorTp.call(this, actor, x, y, width);
        
        actor.tpRate = originalTpRate;
        actor._tp = originalTp;
    };

    const Window_BattleStatus = (window as any).Window_BattleStatus;
    if (Window_BattleStatus) {
        const _BattleFX_Window_BattleStatus_update = Window_BattleStatus.prototype.update;
        Window_BattleStatus.prototype.update = function(): void {
            _BattleFX_Window_BattleStatus_update.call(this);
            if ($gameParty.inBattle()) {
                const members = $gameParty.battleMembers();
                for (let i = 0; i < members.length; i++) {
                    const b = members[i];
                    if (b._vgfNeedRefresh) {
                        this.refresh();
                        b._vgfNeedRefresh = false;
                        break;
                    }
                }
            }
        };
    }

    const _BattleFX_Sprite_Damage_setup = Sprite_Damage.prototype.setup;
    Sprite_Damage.prototype.setup = function(target: any): void {
        _BattleFX_Sprite_Damage_setup.call(this, target);
        
        var result = this._result || (target ? target.result() : null);
        if (!result) return;

        const hitConfig = (window as any).HitCoreConfig || { blockText: 'Block', parryText: 'Parry', deflectText: 'Deflect' };

        // Perfect block/parry/deflect (0 damage): replace digit sprites with text label.
        if ((result.blocked || result.parried || result.deflected) && result.hpDamage === 0) {
            var text: string;
            if (result.blocked) text = hitConfig.blockText;
            else if (result.parried) text = hitConfig.parryText;
            else text = hitConfig.deflectText;
            while (this.children.length > 0) {
                this.removeChild(this.children[0]);
            }
            var w = this.digitWidth();
            var h = this.digitHeight();
            var sprite = this.createChildSprite();
            sprite.bitmap = new Bitmap(text.length * w, h);
            sprite.bitmap.fontSize = h - 4;
            sprite.bitmap.fontWeight = 'bold';
            sprite.bitmap.textColor = '#ffffff';
            sprite.bitmap.outlineColor = '#000000';
            sprite.bitmap.outlineWidth = 3;
            sprite.bitmap.drawText(text, 0, 0, sprite.bitmap.width, h, 'center');
            sprite.x = -(sprite.bitmap.width - 4 * w) / 2;
            sprite.y = 0;
            sprite.dy = 0;
        }
        // Partial block (damage leaked through): show "Block N" as one popup.
        else if (result.blocked && result.hpDamage > 0) {
            var combinedText = hitConfig.blockText + ' ' + result.hpDamage;
            while (this.children.length > 0) {
                this.removeChild(this.children[0]);
            }
            var w = this.digitWidth();
            var h = this.digitHeight();
            var sprite = this.createChildSprite();
            sprite.bitmap = new Bitmap(combinedText.length * w, h);
            sprite.bitmap.fontSize = h - 4;
            sprite.bitmap.fontWeight = 'bold';
            sprite.bitmap.textColor = '#ffffff';
            sprite.bitmap.outlineColor = '#000000';
            sprite.bitmap.outlineWidth = 3;
            sprite.bitmap.drawText(combinedText, 0, 0, sprite.bitmap.width, h, 'center');
            sprite.x = -(sprite.bitmap.width - 4 * w) / 2;
            sprite.y = 0;
            sprite.dy = 0;
        }
        // Partial parry (damage leaked through): show "Parry N" as one popup.
        else if (result.parried && result.hpDamage > 0) {
            var combinedText = hitConfig.parryText + ' ' + result.hpDamage;
            while (this.children.length > 0) {
                this.removeChild(this.children[0]);
            }
            var w = this.digitWidth();
            var h = this.digitHeight();
            var sprite = this.createChildSprite();
            sprite.bitmap = new Bitmap(combinedText.length * w, h);
            sprite.bitmap.fontSize = h - 4;
            sprite.bitmap.fontWeight = 'bold';
            sprite.bitmap.textColor = '#ffffff';
            sprite.bitmap.outlineColor = '#000000';
            sprite.bitmap.outlineWidth = 3;
            sprite.bitmap.drawText(combinedText, 0, 0, sprite.bitmap.width, h, 'center');
            sprite.x = -(sprite.bitmap.width - 4 * w) / 2;
            sprite.y = 0;
            sprite.dy = 0;
        }
        // Partial deflect (damage leaked through): show "Deflect N" as one popup.
        else if (result.deflected && result.hpDamage > 0) {
            var combinedText = hitConfig.deflectText + ' ' + result.hpDamage;
            while (this.children.length > 0) {
                this.removeChild(this.children[0]);
            }
            var w = this.digitWidth();
            var h = this.digitHeight();
            var sprite = this.createChildSprite();
            sprite.bitmap = new Bitmap(combinedText.length * w, h);
            sprite.bitmap.fontSize = h - 4;
            sprite.bitmap.fontWeight = 'bold';
            sprite.bitmap.textColor = '#ffffff';
            sprite.bitmap.outlineColor = '#000000';
            sprite.bitmap.outlineWidth = 3;
            sprite.bitmap.drawText(combinedText, 0, 0, sprite.bitmap.width, h, 'center');
            sprite.x = -(sprite.bitmap.width - 4 * w) / 2;
            sprite.y = 0;
            sprite.dy = 0;
        }

        // Mark Sprite_Damage itself for critical scale animation (whole-popup scaling
        // avoids digits spreading apart from each other like individual-child scaling would)
        if (result && result.critical) {
            (this as any)._isCritical = true;
            (this as any)._critTimer = 0;
        }
    };

    // Critical hit scale animation: whole-popup easeInQuad up, easeOutQuad settle to finalScale.
    // Scaling the parent Sprite_Damage (not individual digit children) keeps digits from spreading apart.
    const _BattleFX_Sprite_Damage_update = Sprite_Damage.prototype.update;
    Sprite_Damage.prototype.update = function(): void {
        _BattleFX_Sprite_Damage_update.call(this);

        var self = (this as any);
        if (self._isCritical) {
            self._critTimer = (self._critTimer || 0) + 1;
            var t = self._critTimer;
            var peak = config.crit.scalePeak;
            var upFrames = config.crit.scaleUpFrames;
            var downFrames = config.crit.scaleDownFrames;
            var finalS = config.crit.finalScale;
            var scale: number;
            if (t <= upFrames) {
                var p = t / upFrames;
                scale = 1.0 + (peak - 1.0) * (p * p);
            } else if (t <= upFrames + downFrames) {
                var p = (t - upFrames) / downFrames;
                scale = peak + (finalS - peak) * (1 - (1 - p) * (1 - p));
            } else {
                scale = finalS;
            }
            self.scale.x = scale;
            self.scale.y = scale;
        }
    };

    if (!config.virtualBar.enabled) return;

    class Sprite_VirtualBar extends Sprite {
        protected _battler: any;
        protected _barType: number;
        protected _layer: number;
        protected _color: string;
        protected _width: number;
        protected _height: number;
        protected _offsetY: number;
        protected _rate: number;
        protected _displayRate: number;
        protected _deepRate: number;
        protected _prevRate: number;
        protected _bmp: any;

        constructor(battler: any, barType: number, layer: number, color: string, offsetY: number) {
            super();
            this._battler = battler;
            this._barType = barType;
            this._layer = layer;
            this._color = color;
            this._width = config.virtualBar.barWidth;
            this._height = config.virtualBar.barHeight;
            this._offsetY = offsetY;
            this._rate = 0;
            this._displayRate = 0;
            this._deepRate = 0;
            this._prevRate = -1;
            this._bmp = null;
        }

        update(): void {
            super.update();
            this.updateRate();
            const needRedraw = this.updatePosition();
            if (needRedraw || this._layer === 0 || this._prevRate !== this.getUseRate()) {
                this._prevRate = this.getUseRate();
                this.redraw();
            }
        }

        getUseRate(): number {
            if (this._layer === 1) return this._deepRate;
            if (this._layer === 2) return this._displayRate;
            return this._rate;
        }

        updateRate(): void {
            let targetRate = 0;
            switch (this._barType) {
                case 0: targetRate = this._battler.displayHpRate(); break;
                case 1: targetRate = this._battler.displayMpRate(); break;
                case 2: targetRate = this._battler.displayTpRate(); break;
            }
            
            this._rate = targetRate;
            
            if (this._layer === 2) {
                // Top layer: use battler-level eased value directly
                // (displayHpRate is already eased in BattleManager.update).
                // Avoid double-easing which makes the bar visually laggy.
                this._displayRate = this._rate;
            } else if (this._layer === 1) {
                const speed = config.virtualBar.deepSpeed / 1000 * 1.5;
                this._deepRate += (this._rate - this._deepRate) * speed;
                if (Math.abs(this._rate - this._deepRate) < 0.0015) {
                    this._deepRate = this._rate;
                }
            }
        }

        updatePosition(): boolean {
            const spr = this._battler.getBattleSprite();
            if (!spr) return false;
            
            const spriteX = spr.x - spr.width * spr.anchor.x + spr.width / 2;
            const spriteY = spr.y;
            
            const newX = spriteX - this._width / 2;
            const newY = spriteY + this._offsetY;
            
            if (this.x !== newX || this.y !== newY) {
                this.x = newX;
                this.y = newY;
                return true;
            }
            return false;
        }

        redraw(): void {
            if (!this._bmp) {
                this._bmp = new Bitmap(this._width + 4, this._height + 4);
            } else {
                this._bmp.clear();
            }
            const ox = 2;
            const oy = 2;
            
            if (this._layer === 0) {
                this._bmp.fillRect(ox, oy, this._width, this._height, config.hp.bgColor);
                const ctx = this._bmp.context;
                ctx.strokeStyle = config.hp.borderColor;
                ctx.lineWidth = 1;
                ctx.strokeRect(ox, oy, this._width, this._height);
                this._bmp._dirty = true;
            } else {
                const useRate = this._layer === 1 ? this._deepRate : this._displayRate;
                const fillWidth = Math.max(0, useRate * this._width);
                this._bmp.fillRect(ox, oy, fillWidth, this._height, this._color);
            }
            
            this.bitmap = this._bmp;
        }
    }

    class Sprite_VirtualText extends Sprite {
        protected _battler: any;
        protected _barType: number;
        protected _offsetY: number;
        protected _fontSize: number;
        protected _infoMode: string;
        protected _prevValue: number;
        protected _bmp: any;

        constructor(battler: any, barType: number, offsetY: number, fontSize: number, infoMode: string) {
            super();
            this._battler = battler;
            this._barType = barType;
            this._offsetY = offsetY;
            this._fontSize = fontSize;
            this._infoMode = infoMode;
            this._prevValue = 0;
            this._bmp = null;
            this.redraw();
        }

        update(): void {
            super.update();
            this.updatePosition();
            this.checkUpdate();
        }

        updatePosition(): boolean {
            const spr = this._battler.getBattleSprite();
            if (!spr) return false;
            
            const spriteX = spr.x - spr.width * spr.anchor.x + spr.width / 2;
            const spriteY = spr.y;
            
            const newX = spriteX - this.bitmap.width / 2;
            const newY = spriteY + this._offsetY;
            
            if (this.x !== newX || this.y !== newY) {
                this.x = newX;
                this.y = newY;
                return true;
            }
            return false;
        }

        checkUpdate(): void {
            let currentValue = 0;
            switch (this._barType) {
                case 0: currentValue = this._battler.displayHp(); break;
                case 1: currentValue = this._battler.displayMp(); break;
                case 2: currentValue = Math.round(this._battler.displayTp()); break;
            }
            if (currentValue !== this._prevValue) {
                this._prevValue = currentValue;
                this.redraw();
            }
        }

        redraw(): void {
            const text = this.getText();
            if (!this._bmp) {
                this._bmp = new Bitmap(200, this._fontSize + 8);
            } else {
                this._bmp.clear();
            }
            this._bmp.fontSize = this._fontSize;
            this._bmp.fontWeight = 'bold';
            this._bmp.textColor = '#ffffff';
            this._bmp.outlineWidth = 2;
            this._bmp.outlineColor = 'rgba(0,0,0,0.8)';
            this._bmp.drawText(text, 0, 0, this._bmp.width, this._bmp.height, 'center');
            this.bitmap = this._bmp;
        }

        getText(): string {
            let current = 0, max = 0;
            switch (this._barType) {
                case 0: current = this._battler.displayHp(); max = this._battler.mhp; break;
                case 1: current = this._battler.displayMp(); max = this._battler.mmp; break;
                case 2: current = this._battler.displayTp(); max = 100; break;
            }
            
            if (this._infoMode === 'none') return '';
            if (this._infoMode === 'percent') {
                const rate = max > 0 ? Math.round((current / max) * 100) : 0;
                return rate + '%';
            }
            if (this._infoMode === 'value') {
                return this.formatNumber(current) + '/' + this.formatNumber(max);
            }
            return current + '/' + max;
        }

        formatNumber(num: number): string {
            if (num >= 1000000) {
                return (num / 1000000).toFixed(1) + 'M';
            } else if (num >= 1000) {
                return (num / 1000).toFixed(1) + 'K';
            }
            return num.toString();
        }
    }

    class Window_VirtualGroup extends Sprite {
        protected _battler: any;
        protected _sprites: any[];
        protected _fadeFrame: number;
        protected _currentFrame: number;
        protected _isFadeIn: boolean;
        protected _isFadeOut: boolean;
        protected _isEnemy: boolean;

        constructor(battler: any) {
            super();
            this._battler = battler;
            this._sprites = [];
            this._fadeFrame = config.virtualBar.fadeFrames;
            this._currentFrame = 0;
            this._isFadeIn = false;
            this._isFadeOut = false;
            this._isEnemy = battler.isEnemy();
            this.opacity = 0;
            
            this.createSprites();
        }

        createSprites(): void {
            if (this._isEnemy) {
                this.createEnemyHpBar();
            }
        }

        createEnemyHpBar(): void {
            const offsetY = config.virtualBar.barHeight / 2 + 4;
            
            const bg = new Sprite_VirtualBar(this._battler, 0, 0, config.hp.bgColor, offsetY);
            const deep = new Sprite_VirtualBar(this._battler, 0, 1, config.hp.deepColor, offsetY);
            const top = new Sprite_VirtualBar(this._battler, 0, 2, config.hp.topColor, offsetY);
            
            this.addChild(bg);
            this.addChild(deep);
            this.addChild(top);
            this._sprites.push(bg, deep, top);
            
            const text = new Sprite_VirtualText(this._battler, 0, offsetY, config.hp.fontSize, 'percent');
            this.addChild(text);
            this._sprites.push(text);
        }

        update(): void {
            super.update();
            this._sprites.forEach(sprite => sprite.update());
            this.updateFade();
        }

        updateFade(): void {
            if (this._isFadeIn && this._currentFrame < this._fadeFrame) {
                this._currentFrame++;
            } else if (this._isFadeOut && this._currentFrame > 0) {
                this._currentFrame--;
            }

            const rate = this._currentFrame / this._fadeFrame;
            const opacity = Math.round(255 * rate);
            
            this.opacity = opacity;
            this._sprites.forEach(sprite => {
                sprite.opacity = opacity;
            });
        }

        fadeIn(): void {
            this._isFadeIn = true;
            this._isFadeOut = false;
        }

        fadeOut(): void {
            this._isFadeIn = false;
            this._isFadeOut = true;
        }

        isFadeInComplete(): boolean {
            return this._currentFrame >= this._fadeFrame;
        }

        isFadeOutComplete(): boolean {
            return this._currentFrame <= 0;
        }
    }

    const _BattleFX_Sprite_Battler_initMembers = (Sprite_Battler as any).prototype.initMembers;
    (Sprite_Battler as any).prototype.initMembers = function(): void {
        _BattleFX_Sprite_Battler_initMembers.call(this);
        this._vgfWindow = null;
        this._vgfWindowBeing = false;
    };

    const _BattleFX_Sprite_Battler_update = (Sprite_Battler as any).prototype.update;
    (Sprite_Battler as any).prototype.update = function(): void {
        _BattleFX_Sprite_Battler_update.call(this);
        this.updateVirtualGroup();
    };

    (Sprite_Battler as any).prototype.updateVirtualGroup = function(): void {
        if (!this._battler || !this._battler.isAlive()) {
            if (this._vgfWindow) {
                this._vgfWindow.fadeOut();
                this._vgfWindow.update();
                if (this._vgfWindow.isFadeOutComplete()) {
                    if (this._vgfWindow.parent) {
                        this._vgfWindow.parent.removeChild(this._vgfWindow);
                    }
                    this._vgfWindow = null;
                    this._vgfWindowBeing = false;
                    // Clear the PIXI sprite reference to prevent makeDeepCopy issues
                    if (this._battler) {
                        this._battler.setBattleSprite(null);
                    }
                }
            }
            return;
        }

        if (!this._vgfWindowBeing) {
            this._vgfWindowBeing = true;
            this._vgfWindow = new Window_VirtualGroup(this._battler);
            this._battler.setBattleSprite(this);
            
            let container = null;
            if (this.parent && this.parent.parent) {
                container = this.parent.parent;
            } else {
                const scene = SceneManager._scene;
                if (scene && scene._spriteset && scene._spriteset._battleField) {
                    container = scene._spriteset._battleField;
                }
            }
            
            if (container) {
                container.addChild(this._vgfWindow);
            }
            
            this._vgfWindow.fadeIn();
        }

        if (config.virtualBar.showMode === 'always') {
            this._vgfWindow.fadeIn();
        } else if (config.virtualBar.showMode === 'select') {
            if (this._battler.isSelected() || this._battler._vgfNeedRefresh) {
                this._vgfWindow.fadeIn();
                this._battler._vgfNeedRefresh = false;
            } else {
                this._vgfWindow.fadeOut();
            }
        }

        this._vgfWindow.update();
    };

    (window as any).fnyoat.BattleFX = {
        config: config,
    };
})();