"use strict";
/*:
* @plugindesc [仇恨面板] MMORPG风格仇恨监控面板 - 独立窗口显示敌人仇恨列表
 * @author fnyoat
 *
 * @param Auto Open
 * @text 战斗开始自动打开
 * @type boolean
 * @default true
 * @desc 进入战斗时自动打开仇恨面板窗口
 *
 * @param Window Width
 * @text 窗口宽度
 * @type number
 * @default 280
 * @desc 仇恨面板窗口宽度
 *
 * @param Window Height
 * @text 窗口高度
 * @type number
 * @default 320
 * @desc 仇恨面板窗口高度
 *
 * @param Update Interval
 * @text 更新间隔(ms)
 * @type number
 * @default 500
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
 * 仇恨面板说明
 * ============================================================================
 *
 * 仇恨面板以独立窗口形式显示当前选中敌人的仇恨列表，类似于MMORPG游戏的仇恨列表。
 * 显示内容：
 *   - 当前选中敌人名称
 *   - 队友仇恨排行
 *   - 总仇恨值
 *   - 伤害仇恨值
 *   - 治疗仇恨值
 *   - 仇恨领先标记(威胁值)
 *   - 嘲讽状态标记
 *
 * 进入战斗时自动打开，战斗结束时自动关闭。
 * 默认显示第一个敌人的仇恨列表。
 *
 * ============================================================================
 * 脚本接口
 * ============================================================================
 *
 *   fnyoat.HatePanel.open()                 - 打开仇恨面板
 *   fnyoat.HatePanel.close()                - 关闭仇恨面板
 *   fnyoat.HatePanel.isOpen()               - 是否打开
 *   fnyoat.HatePanel.setEnemyIndex(index)   - 设置当前显示的敌人索引
 *   fnyoat.HatePanel.update()               - 手动更新面板数据
 
*/
//=============================================================================
// fnyoat_HatePanel.ts
//=============================================================================
Imported = Imported || {};
Imported.fnyoat_HatePanel = true;
window.fnyoat = window.fnyoat || {};
(function () {
    const hatePanelParams = PluginManager.parameters('fnyoat_HatePanel');
    const hatePanelConfig = {
        autoOpen: hatePanelParams['Auto Open'] === 'true',
        windowWidth: Number(hatePanelParams['Window Width'] || 280),
        windowHeight: Number(hatePanelParams['Window Height'] || 320),
        updateInterval: Number(hatePanelParams['Update Interval'] || 500),
        fontSize: Number(hatePanelParams['Font Size'] || 12),
    };
    class HatePanel {
        constructor() {
            this._window = null;
            this._isOpen = false;
            this._updateTimer = null;
            this._currentEnemyIndex = 0;
        }
        isOpen() {
            return this._isOpen && this._window && !this._window.closed;
        }
        open() {
            if (this.isOpen())
                return;
            try {
                let win;
                let foundMethod = '';
                console.log('HatePanel: 使用标准浏览器 window.open()');
                const screenWidth = window.screen.width;
                const screenHeight = window.screen.height;
                const x = 20;
                const y = Math.floor(screenHeight - hatePanelConfig.windowHeight - 100);
                const self = this;
                const panelWindow = window.open('', '', `width=${hatePanelConfig.windowWidth},height=${hatePanelConfig.windowHeight},left=${x},top=${y}`);
                if (!panelWindow) {
                    console.warn('HatePanel: 窗口创建失败，可能被浏览器弹窗拦截');
                    return;
                }
                console.log('HatePanel: 窗口创建成功');
                self._window = panelWindow;
                panelWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>仇恨面板</title></head><body></body></html>`);
                panelWindow.document.close();
                const winDoc = panelWindow.document;
                winDoc.body.style.margin = '0';
                winDoc.body.style.padding = '0';
                winDoc.body.style.fontFamily = '"Microsoft YaHei", "SimHei", sans-serif';
                winDoc.body.style.fontSize = hatePanelConfig.fontSize + 'px';
                winDoc.body.style.background = '#1a1a2e';
                winDoc.body.style.color = '#e0e0e0';
                winDoc.body.style.overflow = 'hidden';
                winDoc.body.style.userSelect = 'none';
                winDoc.body.style.height = '100%';
                winDoc.body.style.boxSizing = 'border-box';
                self._isOpen = true;
                self.render();
                self.startUpdate();
                setTimeout(function () {
                    panelWindow.blur();
                    window.focus();
                }, 100);
                panelWindow.addEventListener('beforeunload', function () {
                    console.log('HatePanel: 窗口关闭');
                    self._isOpen = false;
                    self.stopUpdate();
                });
            }
            catch (e) {
                console.error('HatePanel: Failed to open window', e);
            }
        }
        close() {
            this.stopUpdate();
            if (this._window) {
                try {
                    this._window.close();
                }
                catch (e) { }
                this._window = null;
            }
            this._isOpen = false;
        }
        setEnemyIndex(index) {
            const enemies = $gameTroop.aliveMembers();
            if (index >= 0 && index < enemies.length) {
                this._currentEnemyIndex = $gameTroop.members().indexOf(enemies[index]);
            }
            else {
                this._currentEnemyIndex = 0;
            }
            this.render();
        }
        getCurrentEnemyIndex() {
            return this._currentEnemyIndex;
        }
        setCurrentEnemyIndex(index) {
            this._currentEnemyIndex = index;
        }
        startUpdate() {
            this.stopUpdate();
            this._updateTimer = setInterval(() => {
                if (this.isOpen()) {
                    this.render();
                }
            }, hatePanelConfig.updateInterval);
        }
        stopUpdate() {
            if (this._updateTimer) {
                clearInterval(this._updateTimer);
                this._updateTimer = null;
            }
        }
        render() {
            if (!this._window)
                return;
            const doc = this._window.window.document;
            const enemies = $gameTroop.members();
            const aliveEnemies = $gameTroop.aliveMembers();
            if (aliveEnemies.length === 0) {
                doc.body.innerHTML = `
<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">
    暂无敌人
</div>`;
                return;
            }
            const currentEnemy = enemies[this._currentEnemyIndex];
            if (!currentEnemy || !currentEnemy.isAlive()) {
                const firstAlive = aliveEnemies[0];
                if (firstAlive) {
                    this._currentEnemyIndex = $gameTroop.members().indexOf(firstAlive);
                }
                return;
            }
            const hateList = fnyoat.HateSystem && fnyoat.HateSystem.getEnemyHate ?
                fnyoat.HateSystem.getEnemyHate(this._currentEnemyIndex) : [];
            const isTaunted = fnyoat.HateSystem && fnyoat.HateSystem.isTaunted ?
                fnyoat.HateSystem.isTaunted(this._currentEnemyIndex) : false;
            const hasThreatBonus = fnyoat.HateSystem && fnyoat.HateSystem._system ?
                fnyoat.HateSystem._system.hasThreatBonus(this._currentEnemyIndex) : false;
            const sortedHate = hateList ? [...hateList].sort((a, b) => b.total - a.total) : [];
            const totalHate = sortedHate.reduce((sum, e) => sum + e.total, 0);
            const tauntBadge = isTaunted ? `<span style="font-size: ${hatePanelConfig.fontSize - 2}px; padding: 2px 6px; border-radius: 3px; background: #ff4757; color: #fff; margin-left: 4px;">嘲讽中</span>` : '';
            const threatBadge = hasThreatBonus ? `<span style="font-size: ${hatePanelConfig.fontSize - 2}px; padding: 2px 6px; border-radius: 3px; background: #ffa502; color: #000; margin-left: 4px;">威胁</span>` : '';
            let html = `
<div style="background: linear-gradient(180deg, #4a2c6a 0%, #2d1f3d 100%); padding: 8px 12px; border-bottom: 1px solid #1a1025; display: flex; align-items: center; justify-content: space-between; -webkit-app-region: drag;">
    <div style="font-weight: bold; color: #ff6b9d; font-size: ${hatePanelConfig.fontSize + 2}px;">💀 仇恨面板 - ${currentEnemy.name()}</div>
</div>
<div style="padding: 8px; height: calc(100% - 50px); overflow-y: auto;">
`;
            for (let i = 0; i < sortedHate.length; i++) {
                const entry = sortedHate[i];
                const actor = $gameParty.members().find(a => a.actorId() === entry.actorId);
                if (!actor)
                    continue;
                const isDead = !actor.isAlive();
                const isTop = i === 0;
                const percentage = totalHate > 0 ? (entry.total / totalHate) * 100 : 0;
                const rowStyle = isTop
                    ? 'background: rgba(255, 107, 157, 0.15); border-left: 3px solid #ff6b9d;'
                    : 'background: rgba(255, 255, 255, 0.05);';
                const deadStyle = isDead ? 'opacity: 0.4;' : '';
                const nameStyle = isDead ? 'text-decoration: line-through; color: #888;' : 'color: #fff;';
                const damagePercent = entry.total > 0 ? (entry.damage / entry.total) * 100 : 0;
                const healPercent = entry.total > 0 ? (entry.heal / entry.total) * 100 : 0;
                html += `
<div style="${rowStyle} ${deadStyle} border-radius: 4px; padding: 6px 8px; margin-bottom: 4px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
        <div style="font-weight: bold; ${nameStyle}; font-size: ${hatePanelConfig.fontSize}px;">${isTop ? '👑 ' : ''}${actor.name()}${isTop ? tauntBadge + threatBadge : ''}</div>
        <div style="font-weight: bold; color: #ff6b9d; font-size: ${hatePanelConfig.fontSize}px;">${entry.total.toLocaleString()}</div>
    </div>
    <div style="height: ${hatePanelConfig.fontSize + 4}px; background: rgba(0, 0, 0, 0.3); border-radius: 2px; overflow: hidden; position: relative; display: flex;">
        <div style="height: 100%; background: rgba(255, 71, 87, 0.8); width: ${(percentage * damagePercent / 100)}%;"></div>
        <div style="height: 100%; background: rgba(46, 213, 115, 0.8); width: ${(percentage * healPercent / 100)}%;"></div>
        <div style="position: absolute; top: 0; left: 3px; right: 3px; height: 100%; display: flex; align-items: center; justify-content: space-between; font-size: ${hatePanelConfig.fontSize - 3}px;">
            <span style="color: #fff; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">${entry.damage}</span>
            <span style="color: #fff; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">${entry.heal}</span>
        </div>
    </div>
</div>
`;
            }
            if (sortedHate.length === 0) {
                html += `
<div style="text-align: center; padding: 20px; color: #666;">
    暂无仇恨数据
</div>
`;
            }
            html += `</div>`;
            doc.body.innerHTML = html;
        }
        update() {
            this.render();
        }
    }
    const hatePanel = new HatePanel();
    window.fnyoat.HatePanel = {
        open: () => hatePanel.open(),
        close: () => hatePanel.close(),
        isOpen: () => hatePanel.isOpen(),
        setEnemyIndex: (index) => hatePanel.setEnemyIndex(index),
        getCurrentEnemyIndex: () => hatePanel.getCurrentEnemyIndex(),
        update: () => hatePanel.update(),
        _panel: hatePanel,
    };
    const _HatePanel_BattleManager_startBattle = BattleManager.startBattle;
    BattleManager.startBattle = function () {
        _HatePanel_BattleManager_startBattle.call(this);
        hatePanel.setCurrentEnemyIndex(0);
        if (hatePanelConfig.autoOpen) {
            hatePanel.open();
        }
    };
    const _HatePanel_BattleManager_endBattle = BattleManager.endBattle;
    BattleManager.endBattle = function () {
        _HatePanel_BattleManager_endBattle.call(this);
        hatePanel.close();
    };
    if (typeof nw !== 'undefined' && nw.Window) {
        nw.Window.get().on('close', function () {
            hatePanel.close();
            this.close(true);
        });
    }
    else if (window.nw && window.nw.Window) {
        window.nw.Window.get().on('close', function () {
            hatePanel.close();
            this.close(true);
        });
    }
})();
