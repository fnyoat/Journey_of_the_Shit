//=============================================================================
// fnyoat_BattlePanel.ts
//=============================================================================

/*:
 * @plugindesc [战斗面板] MMORPG风格战斗统计面板 - 独立窗口显示队友伤害/承伤/治疗
 * @author fnyoat
 *
 * @param Auto Open
 * @text 战斗开始自动打开
 * @type boolean
 * @default true
 * @desc 进入战斗时自动打开战斗面板窗口
 *
 * @param Window Width
 * @text 窗口宽度
 * @type number
 * @default 300
 * @desc 战斗面板窗口宽度
 *
 * @param Window Height
 * @text 窗口高度
 * @type number
 * @default 360
 * @desc 战斗面板窗口高度
 *
 * @param Update Interval
 * @text 更新间隔(ms)
 * @type number
 * @default 1000
 * @desc 面板数据刷新间隔
 *
 * @param Font Size
 * @text 字体大小
 * @type number
 * @default 12
 * @desc 面板字体大小
 *
 * @help
 * ============================================================================
 * 战斗面板说明
 * ============================================================================
 *
 * 战斗面板以独立窗口形式显示，类似于MMORPG游戏的团队框架。
 * 显示内容：
 *   - 队友名称
 *   - 有效伤害输出(DPS)
 *   - 有效承伤(DTPS)
 *   - 有效治疗(HTPS)
 *
 * 进入战斗时自动打开，战斗结束时自动关闭。
 *
 * ============================================================================
 * 脚本接口
 * ============================================================================
 *
 *   fnyoat.BattlePanel.open()     - 打开战斗面板
 *   fnyoat.BattlePanel.close()    - 关闭战斗面板
 *   fnyoat.BattlePanel.isOpen()   - 是否打开
 *   fnyoat.BattlePanel.update()   - 手动更新面板数据
 */

declare var Imported: any;
declare var PluginManager: any;
declare var BattleManager: any;
declare var Scene_Battle: any;
declare var $gameParty: any;

Imported = Imported || {};
Imported.fnyoat_BattlePanel = true;

window.fnyoat = window.fnyoat || {};
(function () {
    const panelParams = PluginManager.parameters('fnyoat_BattlePanel');
    const panelConfig = {
        autoOpen: panelParams['Auto Open'] !== 'false',
        windowWidth: Number(panelParams['Window Width'] || 300),
        windowHeight: Number(panelParams['Window Height'] || 360),
        updateInterval: Number(panelParams['Update Interval'] || 1000),
        fontSize: Number(panelParams['Font Size'] || 12),
    };

    class BattlePanel {
        private _window: any;
        private _isOpen: boolean;
        private _updateTimer: any;
        private _battleStartTime: number;
        private _turnCount: number;

        constructor() {
            this._window = null;
            this._isOpen = false;
            this._updateTimer = null;
            this._battleStartTime = 0;
            this._turnCount = 0;
        }

        isOpen(): boolean {
            return this._isOpen && this._window && !this._window.closed;
        }

        open(): void {
            if (this.isOpen()) {
                return;
            }

            try {

                const screenWidth = window.screen.width;
                const screenHeight = window.screen.height;
                const x = Math.floor(screenWidth - panelConfig.windowWidth - 20);
                const y = Math.floor(screenHeight - panelConfig.windowHeight - 100);

                const self = this;
                const panelWindow = window.open('', '', `width=${panelConfig.windowWidth},height=${panelConfig.windowHeight},left=${x},top=${y}`);

                if (!panelWindow) {
                    console.warn('BattlePanel: 窗口创建失败，可能被浏览器弹窗拦截');
                    return;
                }

                self._window = panelWindow;

                panelWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>战斗面板</title></head><body></body></html>`);
                panelWindow.document.close();

                const winDoc = panelWindow.document;

                winDoc.body.style.margin = '0';
                winDoc.body.style.padding = '0';
                winDoc.body.style.fontFamily = '"Microsoft YaHei", "SimHei", sans-serif';
                winDoc.body.style.fontSize = panelConfig.fontSize + 'px';
                winDoc.body.style.background = '#1a1a2e';
                winDoc.body.style.color = '#e0e0e0';
                winDoc.body.style.overflow = 'hidden';
                winDoc.body.style.userSelect = 'none';
                winDoc.body.style.height = '100%';
                winDoc.body.style.boxSizing = 'border-box';

                self._isOpen = true;
                self.render();
                self.startUpdate();

                setTimeout(function(): void {
                    panelWindow.blur();
                    nw.Window.get().focus();
                }, 100);

                panelWindow.addEventListener('beforeunload', function(): void {
                    self._isOpen = false;
                    self.stopUpdate();
                });

            } catch (e) {
                console.error('BattlePanel: Failed to open window', e);
            }
        }

        close(): void {
            this.stopUpdate();
            if (this._window) {
                try {
                    this._window.close();
                } catch (e) {}
                this._window = null;
            }
            this._isOpen = false;
        }

        startUpdate(): void {
            this.stopUpdate();
            this._updateTimer = setInterval(() => {
                if (this.isOpen()) {
                    this.render();
                }
            }, panelConfig.updateInterval);
        }

        stopUpdate(): void {
            if (this._updateTimer) {
                clearInterval(this._updateTimer);
                this._updateTimer = null;
            }
        }

        setBattleStartTime(time: number): void {
            this._battleStartTime = time;
        }

        setTurnCount(count: number): void {
            this._turnCount = count;
        }

        render(): void {
            if (!this._window) return;

            const doc = this._window.window.document;
            const hasHateSystem = fnyoat.HateSystem && fnyoat.HateSystem.getBattleStats;
            const stats = hasHateSystem ? fnyoat.HateSystem.getBattleStats() : [];

            const actors = $gameParty.members();

            const totalDamageDealt = actors.reduce((sum, actor) => {
                const stat = stats.find(s => s.actorId === actor.actorId());
                return sum + (stat ? stat.damageDealt : 0);
            }, 0);

            const totalDamageTaken = actors.reduce((sum, actor) => {
                const stat = stats.find(s => s.actorId === actor.actorId());
                return sum + (stat ? stat.damageTaken : 0);
            }, 0);

            const totalHealingDone = actors.reduce((sum, actor) => {
                const stat = stats.find(s => s.actorId === actor.actorId());
                return sum + (stat ? stat.healingDone : 0);
            }, 0);

            let html = `
<div style="background: linear-gradient(180deg, #0f3460 0%, #16213e 100%); padding: 6px 10px; border-bottom: 1px solid #16213e; display: flex; align-items: center; justify-content: space-between; -webkit-app-region: drag;">
    <div style="font-weight: bold; color: #00d4ff; font-size: ${panelConfig.fontSize}px;">⚔️ 战斗面板</div>
    <div style="font-size: ${panelConfig.fontSize - 3}px; color: #888;">回合: ${this._turnCount}</div>
</div>
<div style="padding: 6px; height: calc(100% - 34px); overflow-y: auto;">
`;

            for (const actor of actors) {
                const actorId = actor.actorId();
                const stat = stats.find(s => s.actorId === actorId);
                const isDead = !actor.isAlive();

                const damageDealt = stat ? stat.damageDealt : 0;
                const damageTaken = stat ? stat.damageTaken : 0;
                const healingDone = stat ? stat.healingDone : 0;

                const damagePercent = totalDamageDealt > 0 ? (damageDealt / totalDamageDealt) * 100 : 0;
                const takenPercent = totalDamageTaken > 0 ? (damageTaken / totalDamageTaken) * 100 : 0;
                const healPercent = totalHealingDone > 0 ? (healingDone / totalHealingDone) * 100 : 0;

                const deadStyle = isDead ? 'opacity: 0.4;' : '';
                const nameStyle = isDead ? 'text-decoration: line-through; color: #666;' : 'color: #fff;';

                html += `
<div style="${deadStyle} margin-bottom: 4px;">
    <div style="font-weight: bold; font-size: ${panelConfig.fontSize - 1}px; margin-bottom: 2px; ${nameStyle}">${actor.name()}</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3px;">
        <div style="background: rgba(255, 71, 87, 0.2); border-radius: 2px; height: ${panelConfig.fontSize + 8}px; position: relative; overflow: hidden;">
            <div style="height: 100%; background: linear-gradient(90deg, rgba(255, 71, 87, 0.8), rgba(255, 107, 129, 0.6)); width: ${damagePercent}%; transition: width 0.3s ease;"></div>
            <div style="position: absolute; top: 0; left: 3px; right: 3px; height: 100%; display: flex; align-items: center; justify-content: space-between; font-size: ${panelConfig.fontSize - 3}px;">
                <span style="color: #fff; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">${damageDealt}</span>
                <span style="color: #fff; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">${damagePercent.toFixed(0)}%</span>
            </div>
        </div>
        <div style="background: rgba(255, 165, 2, 0.2); border-radius: 2px; height: ${panelConfig.fontSize + 8}px; position: relative; overflow: hidden;">
            <div style="height: 100%; background: linear-gradient(90deg, rgba(255, 165, 2, 0.8), rgba(255, 190, 118, 0.6)); width: ${takenPercent}%; transition: width 0.3s ease;"></div>
            <div style="position: absolute; top: 0; left: 3px; right: 3px; height: 100%; display: flex; align-items: center; justify-content: space-between; font-size: ${panelConfig.fontSize - 3}px;">
                <span style="color: #fff; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">${damageTaken}</span>
                <span style="color: #fff; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">${takenPercent.toFixed(0)}%</span>
            </div>
        </div>
        <div style="background: rgba(46, 213, 115, 0.2); border-radius: 2px; height: ${panelConfig.fontSize + 8}px; position: relative; overflow: hidden;">
            <div style="height: 100%; background: linear-gradient(90deg, rgba(46, 213, 115, 0.8), rgba(123, 237, 159, 0.6)); width: ${healPercent}%; transition: width 0.3s ease;"></div>
            <div style="position: absolute; top: 0; left: 3px; right: 3px; height: 100%; display: flex; align-items: center; justify-content: space-between; font-size: ${panelConfig.fontSize - 3}px;">
                <span style="color: #fff; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">${healingDone}</span>
                <span style="color: #fff; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">${healPercent.toFixed(0)}%</span>
            </div>
        </div>
    </div>
</div>
`;
            }

            html += `</div>`;

            doc.body.innerHTML = html;
        }

        private formatTime(seconds: number): string {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            const ms = Math.floor((seconds % 1) * 100);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
        }

        update(): void {
            this.render();
        }
    }

    const battlePanel = new BattlePanel();
    (window as any).fnyoat.BattlePanel = {
        open: () => battlePanel.open(),
        close: () => battlePanel.close(),
        isOpen: () => battlePanel.isOpen(),
        update: () => battlePanel.update(),
        _panel: battlePanel,
    };

    const _Panel_BattleManager_startBattle = BattleManager.startBattle;
    BattleManager.startBattle = function(): void {
            _Panel_BattleManager_startBattle.call(this);
        battlePanel.setBattleStartTime(Date.now());
        battlePanel.setTurnCount(0);
        if (panelConfig.autoOpen) {
            battlePanel.open();
        }
    };

    const _Panel_BattleManager_endBattle = BattleManager.endBattle;
    BattleManager.endBattle = function(): void {
        _Panel_BattleManager_endBattle.call(this);
        battlePanel.close();
    };

    const _Panel_BattleManager_startTurn = BattleManager.startTurn;
    BattleManager.startTurn = function(): void {
        _Panel_BattleManager_startTurn.call(this);
        const currentTurn = $gameTroop.turnCount();
        battlePanel.setTurnCount(currentTurn);
    };

    if (typeof nw !== 'undefined' && nw.Window) {
        nw.Window.get().on('close', function(): void {
            battlePanel.close();
            this.close(true);
        });
    } else if (window.nw && window.nw.Window) {
        window.nw.Window.get().on('close', function(): void {
            battlePanel.close();
            this.close(true);
        });
    }
})();