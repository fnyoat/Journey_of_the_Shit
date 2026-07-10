//=============================================================================
// fnyoat_TwoAccessorySlots.ts
//=============================================================================

/*:
 * @plugindesc [双饰品槽] 允许多个装备类型共享同一个装备池
 * @author fnyoat
 *
 * @param Shared Equip Types
 * @text 共享装备类型ID列表
 * @type number[]
 * @default ["5","6"]
 * @desc 逗号分隔的装备类型ID。这些槽位共享同一个装备池(如饰品槽5和饰品槽6)
 *
 * @help
 * ============================================================================
 * 双饰品槽 - Two Accessory Slots Sharing System
 * ============================================================================
 * 版本: 1.0
 *
 * 问题: RPG Maker MV 中每个装备只能拥有一个装备类型(etypeId)。创建"饰品1"(类型5)和
 *       "饰品2"(类型6)两个装备类型后，饰品只能装在对应类型的槽里，不能通用。
 *
 * 解决方案: 本插件允许将多个装备类型标记为"共享槽位"。它们共享同一个装备池。
 *           例如: 饰品类型5和6共享 → 类型5的饰品可装到类型6的槽，反之亦然。
 *           同一件物品不会同时出现在两个共享槽上。
 *
 * 使用方法:
 *   1. 数据库 → 类型 → 装备类型，创建第二个饰品类型(如"饰品2"，ID=6)
 *   2. 数据库 → 职业/角色，给角色添加两个饰品槽(类型5和类型6)
 *   3. 插件参数中设置 Shared Equip Types 为 "5,6"(默认)
 *   4. 饰品物品只需设定其中一个装备类型，即可在两个槽位通用
 *
 * 兼容性:
 *   - 支持"自动优化"(optimize)，不会重复选择同一装备
 *   - 支持事件指令"更换装备"
 *   - 装备商店等场景只要通过 canEquip + changeEquip 都能正确工作
 *
 * 注意事项:
 *   - 共享槽的所有装备类型的装备都会显示在任意共享槽的物品列表里
 *   - 尽量把饰品物品只设置为其中一个装备类型(如全部设为类型5)，保持数据整洁
 */

(function() {
    // ====== 读取插件参数 ======
    const params = PluginManager.parameters('fnyoat_TwoAccessorySlots');

    function parseSharedTypeIds(): number[] {
        const raw = params['Shared Equip Types'];
        if (!raw) return [5, 6];
        const rawStr = String(raw);
        // 尝试 JSON 数组格式 ["5","6"]
        try {
            const arr = JSON.parse(rawStr);
            if (Array.isArray(arr)) {
                return arr.map(Number).filter(n => !isNaN(n) && n > 0);
            }
        } catch (_) { /* 不是 JSON，尝试逗号分隔 */ }
        // 逗号分隔格式: "5,6"
        return rawStr.split(',').map(Number).filter(n => !isNaN(n) && n > 0);
    }

    const SHARED_TYPE_IDS: number[] = parseSharedTypeIds();
    const sharedTypeSet: Set<number> = new Set(SHARED_TYPE_IDS);

    if (SHARED_TYPE_IDS.length < 2) {
        console.warn('[TwoAccessorySlots] 共享装备类型至少需要2个，插件未生效。');
        return;
    }

    // 判断某个装备类型ID是否属于共享槽
    function isSharedType(etypeId: number): boolean {
        return sharedTypeSet.has(etypeId);
    }

    /**
     * 判断某个槽位是否是共享槽
     * @param actor 角色
     * @param slotId 槽位索引
     * @returns 如果该槽位是共享槽则返回true
     */
    function isSharedSlot(actor: any, slotId: number): boolean {
        const slots = actor.equipSlots();
        return slotId >= 0 && slotId < slots.length && isSharedType(slots[slotId]);
    }

    /**
     * 获取所有共享槽位的索引列表
     */
    function getSharedSlotIndices(actor: any): number[] {
        const slots = actor.equipSlots();
        const indices: number[] = [];
        for (let i = 0; i < slots.length; i++) {
            if (isSharedType(slots[i])) {
                indices.push(i);
            }
        }
        return indices;
    }

    // ====== 注册 ======
    Imported = Imported || {};
    Imported.fnyoat_TwoAccessorySlots = true;

    const fnyoatNS = (window as any).fnyoat = (window as any).fnyoat || {};
    fnyoatNS.TwoAccessorySlots = {
        sharedTypeIds: SHARED_TYPE_IDS,
        isSharedType: isSharedType,
        isSharedSlot: isSharedSlot,
        getSharedSlotIndices: getSharedSlotIndices,
    };

    // ========================================================================
    // 核心修改 1: Game_Actor.prototype.changeEquip
    // 允许共享类型的装备装入共享槽位，同时防止重复装备
    // ========================================================================
    const _TwoSlot_changeEquip = Game_Actor.prototype.changeEquip;
    Game_Actor.prototype.changeEquip = function(slotId: number, item: any): void {
        if (!item) {
            // 卸下装备，使用原始逻辑
            _TwoSlot_changeEquip.call(this, slotId, item);
            return;
        }

        const slotEType = this.equipSlots()[slotId];

        // 如果槽位是共享槽，且物品的装备类型在共享类型中，允许装备
        if (isSharedType(slotEType) && isSharedType(item.etypeId)) {
            // 检查同一个物品是否已经装备在其他共享槽上
            const equips = this.equips();
            const sharedIndices = getSharedSlotIndices(this);
            for (const idx of sharedIndices) {
                if (idx !== slotId && equips[idx] && equips[idx].id === item.id) {
                    // 需要判断是武器还是防具来区分同名物品
                    const e = equips[idx];
                    if (DataManager.isWeapon(item) && DataManager.isWeapon(e)) {
                        return; // 同一件武器已装备在其他共享槽
                    }
                    if (DataManager.isArmor(item) && DataManager.isArmor(e)) {
                        return; // 同一件防具已装备在其他共享槽
                    }
                }
            }
            // 执行装备交换
            if (this.tradeItemWithParty(item, equips[slotId])) {
                this._equips[slotId].setObject(item);
                this.refresh();
            }
            return;
        }

        // 非共享槽或非共享类型物品，使用原始逻辑
        _TwoSlot_changeEquip.call(this, slotId, item);
    };

    // ========================================================================
    // 核心修改 2: Game_Actor.prototype.releaseUnequippableItems
    // 不要因为物品etypeId与槽位etypeId不匹配就卸下共享槽位的共享类型物品
    // ========================================================================
    const _TwoSlot_releaseUnequippable = Game_Actor.prototype.releaseUnequippableItems;
    Game_Actor.prototype.releaseUnequippableItems = function(forcing: boolean): void {
        for (;;) {
            const slots = this.equipSlots();
            const equips = this.equips();
            let changed = false;
            for (let i = 0; i < equips.length; i++) {
                const item = equips[i];
                if (!item) continue;

                if (!this.canEquip(item)) {
                    if (!forcing) {
                        this.tradeItemWithParty(null, item);
                    }
                    this._equips[i].setObject(null);
                    changed = true;
                    continue;
                }

                // 检查类型匹配 - 允许共享槽之间的交叉装备
                const slotType = slots[i];
                if (item.etypeId !== slotType) {
                    // 如果槽位类型和物品类型都是共享类型，允许保留
                    if (isSharedType(slotType) && isSharedType(item.etypeId)) {
                        continue;
                    }
                    if (!forcing) {
                        this.tradeItemWithParty(null, item);
                    }
                    this._equips[i].setObject(null);
                    changed = true;
                }
            }
            if (!changed) break;
        }
    };

    // ========================================================================
    // 核心修改 3: Window_EquipItem.prototype.includes
    // 共享槽位要显示所有共享类型池的物品
    // ========================================================================
    const _TwoSlot_WindowEquipItem_includes = Window_EquipItem.prototype.includes;
    Window_EquipItem.prototype.includes = function(item: any): boolean {
        if (item === null) {
            return true;
        }

        const slotId = this._slotId;
        if (slotId < 0) return false;

        if (!this._actor) return _TwoSlot_WindowEquipItem_includes.call(this, item);

        const slotEType = this._actor.equipSlots()[slotId];

        // 如果是共享槽，接受所有共享类型的物品
        if (isSharedType(slotEType) && isSharedType(item.etypeId)) {
            // 检查物品是否已装备在其他共享槽位 - 已在 inventory 检查中自动处理
            return this._actor.canEquip(item);
        }

        // 非共享槽，使用原始逻辑
        return _TwoSlot_WindowEquipItem_includes.call(this, item);
    };

    // ========================================================================
    // 核心修改 4: Window_EquipItem.prototype.isEnabled
    // 已经装备在其他共享槽上的同名物品仍然可选（如果有多件的话）
    // 实际上通过 inventory 数量控制即可，此处保持 enabled
    // ========================================================================
    // Window_EquipItem 默认 isEnabled 始终返回 true，无需修改

    // ========================================================================
    // 核心修改 5: Game_Actor.prototype.bestEquipItem
    // 共享槽位要从所有共享类型的物品池中选择，且不能选已装备在其他共享槽的物品
    // ========================================================================
    const _TwoSlot_bestEquipItem = Game_Actor.prototype.bestEquipItem;
    Game_Actor.prototype.bestEquipItem = function(slotId: number): any {
        const slotEType = this.equipSlots()[slotId];

        if (!isSharedType(slotEType)) {
            return _TwoSlot_bestEquipItem.call(this, slotId);
        }

        // 获取所有共享类型物品
        const items = $gameParty.equipItems().filter(function(item: any) {
            return isSharedType(item.etypeId) && this.canEquip(item);
        }, this);

        // 排除已经装备在其他共享槽位的物品
        const equips = this.equips();
        const sharedIndices = getSharedSlotIndices(this);
        const equippedIds = new Set<number>();
        for (const idx of sharedIndices) {
            if (idx !== slotId && equips[idx]) {
                equippedIds.add(equips[idx].id);
            }
        }

        const filteredItems = items.filter(function(item: any) {
            return !equippedIds.has(item.id);
        });

        let bestItem: any = null;
        let bestPerformance = -1000;
        for (let i = 0; i < filteredItems.length; i++) {
            const performance = this.calcEquipItemPerformance(filteredItems[i]);
            if (performance > bestPerformance) {
                bestPerformance = performance;
                bestItem = filteredItems[i];
            }
        }

        return bestItem;
    };

    // ========================================================================
    // 核心修改 6: Game_Actor.prototype.changeEquipById
    // 事件指令 Change Equipment 也要支持共享槽
    // ========================================================================
    const _TwoSlot_changeEquipById = Game_Actor.prototype.changeEquipById;
    Game_Actor.prototype.changeEquipById = function(etypeId: number, itemId: number): void {
        const slots = this.equipSlots();
        const slotId = etypeId - 1;

        // 如果这个 etypeId 对应的是一个共享槽
        if (isSharedType(etypeId)) {
            // 找到属于共享类型组的第一个可用槽位
            for (let i = 0; i < slots.length; i++) {
                if (isSharedType(slots[i])) {
                    const item = (slots[i] === 1) ? $dataWeapons[itemId] : $dataArmors[itemId];
                    this.changeEquip(i, item);
                    return;
                }
            }
        }

        // 回退到原始逻辑
        _TwoSlot_changeEquipById.call(this, etypeId, itemId);
    };

})();
