//=============================================================================
// fnyoat_FollowerFix.ts
//=============================================================================

/*:
 * @plugindesc [v1.3.0] 修复读档后随从堆叠，并避免菜单返回时误触 gather
 * @author fnyoat
 *
 * @help
 * ============================================================================
 * 随从位置修复 说明
 * ============================================================================
 *
 * 问题：
 *   RPG Maker MV 读档时会在 performTransfer 中调用
 *   Game_Player.locate() → _followers.synchronize()，
 *   把所有随从全部拍到领队的同一格，丢失存档中的位置和方向。
 *
 * 修复方式：
 *   1. hook DataManager.extractSaveContents —— 读档数据刚恢复时
 *      立刻抓取每个随从的 _x / _y / _direction，存入缓存。
 *   2. hook Scene_Map.onMapLoaded —— 地图加载完成（transfer 已执行），
 *      如果存在缓存则逐一还原每个随从的位置和方向。
 *      如果缓存为空（异常情况），fallback 到 gather() 让随从散开。
 *
 * 兼容性：
 *   仅挂钩 extractSaveContents / onMapLoaded，不修改核心逻辑。
 *   与所有战斗/UI 插件兼容。
 */

{
    // 缓存：{ [memberIndex]: { x, y, d } }
    let _savedFollowerPositions: { [index: number]: { x: number; y: number; d: number } } | null = null;

    function _captureFollowerPositions(): void {
        if (!$gamePlayer || !$gamePlayer.followers) {
            _savedFollowerPositions = null;
            return;
        }
        const data: { [index: number]: { x: number; y: number; d: number } } = {};
        const followers = $gamePlayer.followers()._data;
        let hasAny = false;
        for (let i = 0; i < followers.length; i++) {
            const f = followers[i];
            if (f && f._memberIndex && f.isVisible()) {
                data[f._memberIndex] = { x: f._x, y: f._y, d: f._direction };
                hasAny = true;
            }
        }
        _savedFollowerPositions = hasAny ? data : null;
    }

    function _restoreFollowerPositions(): void {
        if (!$gamePlayer || !$gamePlayer.followers) return;
        const cache = _savedFollowerPositions;
        _savedFollowerPositions = null; // 只消费一次

        // 只有读档时才有缓存。从菜单/战斗返回时 onMapLoaded 也会触发，
        // 但此时没有 performTransfer → synchronize，随从位置本就正确，无需操作。
        if (!cache) return;

        const followers = $gamePlayer.followers()._data;
        for (let i = 0; i < followers.length; i++) {
            const f = followers[i];
            if (!f || !f._memberIndex) continue;
            const pos = cache[f._memberIndex];
            if (pos) {
                f._x = pos.x;
                f._y = pos.y;
                f._realX = pos.x;
                f._realY = pos.y;
                f._direction = pos.d;
                // 清除移动状态，避免残留的 moveTo 扰乱位置
                f._moveRoute = null;
                f._moveRouteForcing = false;
                f._stopCount = 0;
            }
        }
    }

    // ---------------------------------------------------------------
    // hook extractSaveContents：读档数据刚恢复，立即捕获随从坐标
    // ---------------------------------------------------------------
    const _DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function (contents: any): void {
        _DataManager_extractSaveContents.call(this, contents);
        _captureFollowerPositions();
    };

    // ---------------------------------------------------------------
    // hook onMapLoaded：地图加载完成（含 performTransfer 带来的堆叠），还原位置
    // ---------------------------------------------------------------
    const _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function (this: Scene_Map): void {
        _Scene_Map_onMapLoaded.call(this);
        _restoreFollowerPositions();
    };
}
