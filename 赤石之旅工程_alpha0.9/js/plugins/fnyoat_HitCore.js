"use strict";
/*:
* @plugindesc [命中核心] 格挡、招架判定系统
 * @author fnyoat
 *
 * @param Default Block Rate
 * @text 默认格挡率(%)
 * @type number
 * @default 0
 * @desc 无格挡物品时的默认格挡率
 *
 * @param Default Parry Rate
 * @text 默认招架率(%)
 * @type number
 * @default 0
 * @desc 无武器时的默认招架率
 *
 * @param Block Damage Reduction
 * @text 格挡减伤率(%)
 * @type number
 * @default 20
 * @desc 格挡成功时先按此比例减免，再减格挡值
 *
 * @param Parry Damage Reduction
 * @text 招架减伤率(%)
 * @type number
 * @default 5
 * @desc 招架成功时先按此比例减免，再减招架值
 *
 * @param Block Deflect Reduction
 * @text 格挡偏折减伤率(%)
 * @type number
 * @default 30
 * @desc 格挡→偏折成功时先按此比例减免，再减偏折值
 *
 * @param Parry Deflect Reduction
 * @text 招架偏折减伤率(%)
 * @type number
 * @default 50
 * @desc 招架→偏折成功时先按此比例减免，再减偏折值
 *
 * @param Block Text
 * @text 格挡文字
 * @type string
 * @default Block
 * @desc 格挡成功时显示的文字
 *
 * @param Parry Text
 * @text 招架文字
 * @type string
 * @default Parry
 * @desc 招架成功时显示的文字
 *
 * @param Default Deflect Rate
 * @text 默认偏折率(%)
 * @type number
 * @default 0
 * @desc 无偏折物品时的默认偏折率
 *
 * @param Deflect Damage Reduction
 * @text 偏折减伤率(%)
 * @type number
 * @default 50
 * @desc 偏折成功时将伤害先按此比例减免，再减偏折值
 *
 * @param Deflect Text
 * @text 偏折文字
 * @type string
 * @default Deflect
 * @desc 偏折成功时显示的文字
 *
 * @help
 * ============================================================================
 * 命中核心说明
 * ============================================================================
 *
 * 判定顺序：
 *   1. 未命中判定 (Miss)
 *   2. 闪避判定 (Evade)
 *   3. 格挡判定 (Block)
 *      → 格挡成功且主标签含偏折参数 → 掷偏折骰 → 偏折成功则偏折替代格挡
 *   4. 招架判定 (Parry)
 *      → 招架成功且主标签含偏折参数 → 掷偏折骰 → 偏折成功则偏折替代招架
 *   5. 独立偏折判定 (Deflect)
 *      → 未格挡也未招架时，单独判定偏折
 *
 * 物品/状态标签：
 *   <Block: X,Y>           - 主格挡标签：格挡率X%，格挡值Y
 *   <Block: X,Y,D,R>       - 主格挡标签：格挡率X%，格挡值Y，格挡成功时D%转为偏折，偏折值R
 *   <Parry: X,Y>           - 主招架标签：招架率X%，招架值Y
 *   <Parry: X,Y,D,R>       - 主招架标签：招架率X%，招架值Y，招架成功时D%转为偏折，偏折值R
 *   <Deflect: X,Y>         - 次偏折标签：偏折率X%，偏折值Y（累加到所有主偏折判定上）
 *   <IndependentDeflect: X,Y> - 独立偏折标签：偏折率X%，偏折值Y（仅在没有格挡/招架时单独触发）
 *   <No Evade>             - 无法闪避此攻击
 *   <No Block>             - 无法格挡此攻击
 *   <No Parry>             - 无法招架此攻击
 *   <No Deflect>           - 无法偏折此攻击（同时禁用所有偏折，含主标签偏折和独立偏折）
 *   <Enable Parry QTE>     - 启用招架QTE
 *
 * 偏折标签体系：
 *   - 主偏折：嵌入在 Block/Parry 标签里的 D,R 参数，是主格挡/主招架的附属判定
 *   - 次偏折（<Deflect>）：独立于格挡/招架，累加到所有主偏折的判定率和值上
 *   - 独立偏折（<IndependentDeflect>）：单独累加，仅在没有格挡/招架时触发
 *   - 不同方式产生的偏折使用不同减伤率（格挡偏折/招架偏折/独立偏折各有独立参数）
 *
 * 格挡机制：
 *   - 需要携带带有<Block: X,Y>标签的物品
 *   - 格挡成功后，伤害先按减伤率减免，再减去格挡值
 *   - 减伤公式：实际伤害 = max(0, floor(伤害 × (1 - 减伤率%) - 格挡值))
 *   - 格挡后有残余伤害时显示"Block N"弹窗
 *
 * 招架机制：
 *   - 需要装备武器（武器有<Parry: X,Y>标签）
 *   - 招架率越高，QTE判定越容易
 *   - 招架成功后，伤害先按减伤率减免，再减去招架值
 *   - 减伤公式：实际伤害 = max(0, floor(伤害 × (1 - 减伤率%) - 招架值))
 *   - 招架值足以完全抵消伤害时，显示"Parry"；否则显示"Parry N"弹窗
 *   - 默认自动判定，需要<Enable Parry QTE>标签才会触发QTE
 *
 * 偏折机制：
 *   - 主偏折：格挡/招架的主标签可选含偏折参数(D,R)，拦截成功时可能弹开攻击
 *   - 次偏折(<Deflect>)：累加率与值到所有主偏折判定上，不独立触发
 *   - 独立偏折(<IndependentDeflect>)：单独累加，仅在没有格挡/招架时触发
 *   - 同一次判定不会同时产生格挡/招架和偏折
 *   - 偏折成功后，伤害先按对应减伤率减免，再减去偏折值
 *   - 减伤公式：实际伤害 = max(0, floor(伤害 × (1 - 减伤率%) - 偏折值))
 *   - 完美偏折(0伤害)时显示"Deflect"，残余伤害时显示"Deflect N"弹窗
 *
 
*/
//=============================================================================
// fnyoat_HitCore.ts
//=============================================================================
/*:
 * @plugindesc [命中核心] 格挡、招架判定系统
 * @author fnyoat
 *
 * @param Default Block Rate
 * @text 默认格挡率(%)
 * @type number
 * @default 0
 * @desc 无格挡物品时的默认格挡率
 *
 * @param Default Parry Rate
 * @text 默认招架率(%)
 * @type number
 * @default 0
 * @desc 无武器时的默认招架率
 *
 * @param Block Damage Reduction
 * @text 格挡减伤率(%)
 * @type number
 * @default 20
 * @desc 格挡成功时先按此比例减免，再减格挡值
 *
 * @param Parry Damage Reduction
 * @text 招架减伤率(%)
 * @type number
 * @default 5
 * @desc 招架成功时先按此比例减免，再减招架值
 *
 * @param Block Deflect Reduction
 * @text 格挡偏折减伤率(%)
 * @type number
 * @default 30
 * @desc 格挡→偏折成功时先按此比例减免，再减偏折值
 *
 * @param Parry Deflect Reduction
 * @text 招架偏折减伤率(%)
 * @type number
 * @default 50
 * @desc 招架→偏折成功时先按此比例减免，再减偏折值
 *
 * @param Block Text
 * @text 格挡文字
 * @type string
 * @default Block
 * @desc 格挡成功时显示的文字
 *
 * @param Parry Text
 * @text 招架文字
 * @type string
 * @default Parry
 * @desc 招架成功时显示的文字
 *
 * @param Default Deflect Rate
 * @text 默认偏折率(%)
 * @type number
 * @default 0
 * @desc 无偏折物品时的默认偏折率
 *
 * @param Deflect Damage Reduction
 * @text 偏折减伤率(%)
 * @type number
 * @default 50
 * @desc 偏折成功时将伤害先按此比例减免，再减偏折值
 *
 * @param Deflect Text
 * @text 偏折文字
 * @type string
 * @default Deflect
 * @desc 偏折成功时显示的文字
 *
 * @help
 * ============================================================================
 * 命中核心说明
 * ============================================================================
 *
 * 判定顺序：
 *   1. 未命中判定 (Miss)
 *   2. 闪避判定 (Evade)
 *   3. 格挡判定 (Block)
 *      → 格挡成功且主标签含偏折参数 → 掷偏折骰 → 偏折成功则偏折替代格挡
 *   4. 招架判定 (Parry)
 *      → 招架成功且主标签含偏折参数 → 掷偏折骰 → 偏折成功则偏折替代招架
 *   5. 独立偏折判定 (Deflect)
 *      → 未格挡也未招架时，单独判定偏折
 *
 * 物品/状态标签：
 *   <Block: X,Y>           - 主格挡标签：格挡率X%，格挡值Y
 *   <Block: X,Y,D,R>       - 主格挡标签：格挡率X%，格挡值Y，格挡成功时D%转为偏折，偏折值R
 *   <Parry: X,Y>           - 主招架标签：招架率X%，招架值Y
 *   <Parry: X,Y,D,R>       - 主招架标签：招架率X%，招架值Y，招架成功时D%转为偏折，偏折值R
 *   <Deflect: X,Y>         - 次偏折标签：偏折率X%，偏折值Y（累加到所有主偏折判定上）
 *   <IndependentDeflect: X,Y> - 独立偏折标签：偏折率X%，偏折值Y（仅在没有格挡/招架时单独触发）
 *   <No Evade>             - 无法闪避此攻击
 *   <No Block>             - 无法格挡此攻击
 *   <No Parry>             - 无法招架此攻击
 *   <No Deflect>           - 无法偏折此攻击（同时禁用所有偏折，含主标签偏折和独立偏折）
 *   <Enable Parry QTE>     - 启用招架QTE
 *
 * 偏折标签体系：
 *   - 主偏折：嵌入在 Block/Parry 标签里的 D,R 参数，是主格挡/主招架的附属判定
 *   - 次偏折（<Deflect>）：独立于格挡/招架，累加到所有主偏折的判定率和值上
 *   - 独立偏折（<IndependentDeflect>）：单独累加，仅在没有格挡/招架时触发
 *   - 不同方式产生的偏折使用不同减伤率（格挡偏折/招架偏折/独立偏折各有独立参数）
 *
 * 格挡机制：
 *   - 需要携带带有<Block: X,Y>标签的物品
 *   - 格挡成功后，伤害先按减伤率减免，再减去格挡值
 *   - 减伤公式：实际伤害 = max(0, floor(伤害 × (1 - 减伤率%) - 格挡值))
 *   - 格挡后有残余伤害时显示"Block N"弹窗
 *
 * 招架机制：
 *   - 需要装备武器（武器有<Parry: X,Y>标签）
 *   - 招架率越高，QTE判定越容易
 *   - 招架成功后，伤害先按减伤率减免，再减去招架值
 *   - 减伤公式：实际伤害 = max(0, floor(伤害 × (1 - 减伤率%) - 招架值))
 *   - 招架值足以完全抵消伤害时，显示"Parry"；否则显示"Parry N"弹窗
 *   - 默认自动判定，需要<Enable Parry QTE>标签才会触发QTE
 *
 * 偏折机制：
 *   - 主偏折：格挡/招架的主标签可选含偏折参数(D,R)，拦截成功时可能弹开攻击
 *   - 次偏折(<Deflect>)：累加率与值到所有主偏折判定上，不独立触发
 *   - 独立偏折(<IndependentDeflect>)：单独累加，仅在没有格挡/招架时触发
 *   - 同一次判定不会同时产生格挡/招架和偏折
 *   - 偏折成功后，伤害先按对应减伤率减免，再减去偏折值
 *   - 减伤公式：实际伤害 = max(0, floor(伤害 × (1 - 减伤率%) - 偏折值))
 *   - 完美偏折(0伤害)时显示"Deflect"，残余伤害时显示"Deflect N"弹窗
 *
 */
(function () {
    const params = PluginManager.parameters('fnyoat_HitCore');
    const hitCoreConfig = {
        defaultBlockRate: Number(params['Default Block Rate']) || 0,
        defaultParryRate: Number(params['Default Parry Rate']) || 0,
        defaultDeflectRate: Number(params['Default Deflect Rate']) || 0,
        blockDamageReduction: Number(params['Block Damage Reduction']) || 20,
        parryDamageReduction: Number(params['Parry Damage Reduction']) || 5,
        blockDeflectReduction: Number(params['Block Deflect Reduction']) || 30,
        parryDeflectReduction: Number(params['Parry Deflect Reduction']) || 60,
        deflectDamageReduction: Number(params['Deflect Damage Reduction']) || 50,
        blockText: params['Block Text'] || 'Block',
        parryText: params['Parry Text'] || 'Parry',
        deflectText: params['Deflect Text'] || 'Deflect',
    };
    window.HitCoreConfig = hitCoreConfig;
    const _HitCore_Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
    Game_Action.prototype.makeDamageValue = function (target, critical) {
        const value = _HitCore_Game_Action_makeDamageValue.call(this, target, critical);
        if (value <= 0)
            return value;
        const result = target.result();
        const itemMeta = this.item().meta || {};
        const canBlock = !itemMeta['NoBlock'] && !target.hasStateTag('NoBlock');
        const canParry = !itemMeta['NoParry'] && !target.hasStateTag('NoParry');
        const canDeflect = !itemMeta['NoDeflect'] && !target.hasStateTag('NoDeflect');
        let finalValue = value;
        let wasDefended = false;
        if (canBlock) {
            const blockResult = this.applyBlock(target, finalValue, result, canDeflect);
            finalValue = blockResult.damage;
            if (blockResult.defended)
                wasDefended = true;
        }
        if (canParry && finalValue > 0 && !wasDefended) {
            const parryResult = this.applyParry(target, finalValue, result, canDeflect);
            finalValue = parryResult.damage;
            if (parryResult.defended)
                wasDefended = true;
        }
        if (canDeflect && finalValue > 0 && !wasDefended) {
            finalValue = this.applyIndependentDeflect(target, finalValue, result);
        }
        result.blocked = result.blocked || false;
        result.parried = result.parried || false;
        result.deflected = result.deflected || false;
        result.blockValue = result.blockValue || 0;
        result.parryValue = result.parryValue || 0;
        result.deflectValue = result.deflectValue || 0;
        return finalValue;
    };
    const _HitCore_Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function (target) {
        _HitCore_Game_Action_apply.call(this, target);
        const result = target.result();
        if (result.isHit()) {
            const itemMeta = this.item().meta || {};
            result.evaded = result.evaded && !itemMeta['NoEvade'] && !target.hasStateTag('NoEvade');
        }
    };
    Game_Action.prototype.applyBlock = function (target, damage, result, canDeflect) {
        if (damage <= 0)
            return { damage, defended: false };
        const blockInfo = target.getBlockInfo();
        if (!blockInfo.hasBlockItem)
            return { damage, defended: false };
        const blockRate = blockInfo.blockRate / 100;
        if (Math.random() >= blockRate)
            return { damage, defended: false };
        if (canDeflect) {
            const secondaryDeflect = target.getSecondaryDeflectInfo();
            const totalDeflectRate = blockInfo.deflectRate + secondaryDeflect.deflectRate;
            if (totalDeflectRate > 0) {
                const deflectRate = totalDeflectRate / 100;
                if (Math.random() < deflectRate) {
                    const deflectInfo = { deflectRate: totalDeflectRate, deflectValue: blockInfo.deflectValue + secondaryDeflect.deflectValue };
                    const reductionRate = hitCoreConfig.blockDeflectReduction / 100;
                    return { damage: this.applyDeflectDamage(damage, result, deflectInfo, reductionRate), defended: true };
                }
            }
        }
        result.blocked = true;
        result.blockValue = blockInfo.blockValue;
        const reductionRate = hitCoreConfig.blockDamageReduction / 100;
        const reduced = Math.floor(damage * (1 - reductionRate)) - blockInfo.blockValue;
        return { damage: Math.max(0, reduced), defended: true };
    };
    Game_Action.prototype.applyParry = function (target, damage, result, canDeflect) {
        if (damage <= 0)
            return { damage, defended: false };
        const parryInfo = target.getParryInfo();
        if (!parryInfo.hasWeapon)
            return { damage, defended: false };
        const parryRate = parryInfo.parryRate / 100;
        if (Math.random() >= parryRate)
            return { damage, defended: false };
        if (canDeflect) {
            const secondaryDeflect = target.getSecondaryDeflectInfo();
            const totalDeflectRate = parryInfo.deflectRate + secondaryDeflect.deflectRate;
            if (totalDeflectRate > 0) {
                const deflectRate = totalDeflectRate / 100;
                if (Math.random() < deflectRate) {
                    const deflectInfo = { deflectRate: totalDeflectRate, deflectValue: parryInfo.deflectValue + secondaryDeflect.deflectValue };
                    const reductionRate = hitCoreConfig.parryDeflectReduction / 100;
                    return { damage: this.applyDeflectDamage(damage, result, deflectInfo, reductionRate), defended: true };
                }
            }
        }
        const hasQTE = target.hasParryQTE();
        let qteSuccessRate = 1;
        if (hasQTE) {
            qteSuccessRate = this.executeParryQTE(parryInfo.parryRate);
        }
        const effectiveParryValue = parryInfo.parryValue * qteSuccessRate;
        result.parried = true;
        result.parryValue = effectiveParryValue;
        const reductionRate = hitCoreConfig.parryDamageReduction / 100;
        const reduced = Math.floor(damage * (1 - reductionRate)) - effectiveParryValue;
        return { damage: Math.max(0, reduced), defended: true };
    };
    Game_Action.prototype.executeParryQTE = function (parryRate) {
        const difficulty = 1 - (parryRate / 100);
        const random = Math.random();
        if (random < 0.3) {
            return 1.0;
        }
        else if (random < 0.6) {
            return 0.7;
        }
        else if (random < 0.85) {
            return 0.4;
        }
        else {
            return 0.1;
        }
    };
    Game_Action.prototype.applyDeflectDamage = function (damage, result, deflectInfo, reductionRate) {
        result.deflected = true;
        result.deflectValue = deflectInfo.deflectValue;
        const reduced = Math.floor(damage * (1 - reductionRate)) - deflectInfo.deflectValue;
        return Math.max(0, reduced);
    };
    Game_Action.prototype.applyIndependentDeflect = function (target, damage, result) {
        if (damage <= 0)
            return damage;
        const deflectInfo = target.getIndependentDeflectInfo();
        const deflectRate = deflectInfo.deflectRate / 100;
        if (deflectRate <= 0 || Math.random() >= deflectRate)
            return damage;
        const reductionRate = hitCoreConfig.deflectDamageReduction / 100;
        return this.applyDeflectDamage(damage, result, deflectInfo, reductionRate);
    };
    function parseBlockTag(tag) {
        if (!tag)
            return null;
        const nums = tag.split(',').map(Number);
        if (nums.length >= 2 && !isNaN(nums[0]) && !isNaN(nums[1])) {
            return {
                rate: nums[0],
                value: nums[1],
                deflectRate: (nums.length >= 4 && !isNaN(nums[2]) && !isNaN(nums[3])) ? nums[2] : 0,
                deflectValue: (nums.length >= 4 && !isNaN(nums[2]) && !isNaN(nums[3])) ? nums[3] : 0,
            };
        }
        return null;
    }
    function parseDeflectTag(tag) {
        if (!tag)
            return null;
        const match = tag.match(/(\d+),(\d+)/);
        if (match) {
            return { rate: Number(match[1]), value: Number(match[2]) };
        }
        return null;
    }
    Game_Battler.prototype.getBlockInfo = function () {
        let hasBlockItem = false;
        let totalBlockRate = hitCoreConfig.defaultBlockRate;
        let totalBlockValue = 0;
        let totalDeflectRate = 0;
        let totalDeflectValue = 0;
        if (this.equips) {
            const equips = this.equips();
            for (const equip of equips) {
                if (equip && equip.meta['Block']) {
                    const parsed = parseBlockTag(equip.meta['Block']);
                    if (parsed) {
                        hasBlockItem = true;
                        totalBlockRate += parsed.rate;
                        totalBlockValue += parsed.value;
                        totalDeflectRate += parsed.deflectRate;
                        totalDeflectValue += parsed.deflectValue;
                    }
                }
            }
        }
        if (this.states) {
            for (const state of this.states()) {
                if (state.meta['Block']) {
                    const parsed = parseBlockTag(state.meta['Block']);
                    if (parsed) {
                        totalBlockRate += parsed.rate;
                        totalBlockValue += parsed.value;
                        totalDeflectRate += parsed.deflectRate;
                        totalDeflectValue += parsed.deflectValue;
                    }
                }
            }
        }
        // For enemies: read block/deflect from enemy database note tags
        if (this.enemy) {
            const enemyMeta = this.enemy().meta;
            if (enemyMeta['Block']) {
                const parsed = parseBlockTag(enemyMeta['Block']);
                if (parsed) {
                    hasBlockItem = true;
                    totalBlockRate += parsed.rate;
                    totalBlockValue += parsed.value;
                    totalDeflectRate += parsed.deflectRate;
                    totalDeflectValue += parsed.deflectValue;
                }
            }
        }
        return { hasBlockItem, blockRate: totalBlockRate, blockValue: totalBlockValue, deflectRate: totalDeflectRate, deflectValue: totalDeflectValue };
    };
    function parseParryTag(tag) {
        if (!tag)
            return null;
        const nums = tag.split(',').map(Number);
        if (nums.length >= 2 && !isNaN(nums[0]) && !isNaN(nums[1])) {
            return {
                rate: nums[0],
                value: nums[1],
                deflectRate: (nums.length >= 4 && !isNaN(nums[2]) && !isNaN(nums[3])) ? nums[2] : 0,
                deflectValue: (nums.length >= 4 && !isNaN(nums[2]) && !isNaN(nums[3])) ? nums[3] : 0,
            };
        }
        return null;
    }
    Game_Battler.prototype.getParryInfo = function () {
        let hasWeapon = false;
        let totalParryRate = hitCoreConfig.defaultParryRate;
        let totalParryValue = 0;
        let totalDeflectRate = 0;
        let totalDeflectValue = 0;
        if (this.equips) {
            const equips = this.equips();
            for (const equip of equips) {
                if (equip && equip.wtypeId > 0) {
                    hasWeapon = true;
                    if (equip.meta['Parry']) {
                        const parsed = parseParryTag(equip.meta['Parry']);
                        if (parsed) {
                            totalParryRate += parsed.rate;
                            totalParryValue += parsed.value;
                            totalDeflectRate += parsed.deflectRate;
                            totalDeflectValue += parsed.deflectValue;
                        }
                    }
                }
            }
        }
        if (this.states) {
            for (const state of this.states()) {
                if (state.meta['Parry']) {
                    const parsed = parseParryTag(state.meta['Parry']);
                    if (parsed) {
                        totalParryRate += parsed.rate;
                        totalParryValue += parsed.value;
                        totalDeflectRate += parsed.deflectRate;
                        totalDeflectValue += parsed.deflectValue;
                    }
                }
            }
        }
        // For enemies: read parry/deflect from enemy database note tags
        if (this.enemy) {
            const enemyMeta = this.enemy().meta;
            if (enemyMeta['Parry']) {
                const parsed = parseParryTag(enemyMeta['Parry']);
                if (parsed) {
                    hasWeapon = true;
                    totalParryRate += parsed.rate;
                    totalParryValue += parsed.value;
                    totalDeflectRate += parsed.deflectRate;
                    totalDeflectValue += parsed.deflectValue;
                }
            }
        }
        return { hasWeapon, parryRate: totalParryRate, parryValue: totalParryValue, deflectRate: totalDeflectRate, deflectValue: totalDeflectValue };
    };
    Game_Battler.prototype.getSecondaryDeflectInfo = function () {
        let totalDeflectRate = 0;
        let totalDeflectValue = 0;
        if (this.equips) {
            const equips = this.equips();
            for (const equip of equips) {
                if (equip && equip.meta['Deflect']) {
                    const parsed = parseDeflectTag(equip.meta['Deflect']);
                    if (parsed) {
                        totalDeflectRate += parsed.rate;
                        totalDeflectValue += parsed.value;
                    }
                }
            }
        }
        if (this.states) {
            for (const state of this.states()) {
                if (state.meta['Deflect']) {
                    const parsed = parseDeflectTag(state.meta['Deflect']);
                    if (parsed) {
                        totalDeflectRate += parsed.rate;
                        totalDeflectValue += parsed.value;
                    }
                }
            }
        }
        // For enemies: read secondary deflect from enemy database note tags
        if (this.enemy) {
            const enemyMeta = this.enemy().meta;
            if (enemyMeta['Deflect']) {
                const parsed = parseDeflectTag(enemyMeta['Deflect']);
                if (parsed) {
                    totalDeflectRate += parsed.rate;
                    totalDeflectValue += parsed.value;
                }
            }
        }
        return { deflectRate: totalDeflectRate, deflectValue: totalDeflectValue };
    };
    Game_Battler.prototype.getIndependentDeflectInfo = function () {
        let totalDeflectRate = hitCoreConfig.defaultDeflectRate;
        let totalDeflectValue = 0;
        if (this.equips) {
            const equips = this.equips();
            for (const equip of equips) {
                if (equip && equip.meta['IndependentDeflect']) {
                    const parsed = parseDeflectTag(equip.meta['IndependentDeflect']);
                    if (parsed) {
                        totalDeflectRate += parsed.rate;
                        totalDeflectValue += parsed.value;
                    }
                }
            }
        }
        if (this.states) {
            for (const state of this.states()) {
                if (state.meta['IndependentDeflect']) {
                    const parsed = parseDeflectTag(state.meta['IndependentDeflect']);
                    if (parsed) {
                        totalDeflectRate += parsed.rate;
                        totalDeflectValue += parsed.value;
                    }
                }
            }
        }
        // For enemies: read independent deflect from enemy database note tags
        if (this.enemy) {
            const enemyMeta = this.enemy().meta;
            if (enemyMeta['IndependentDeflect']) {
                const parsed = parseDeflectTag(enemyMeta['IndependentDeflect']);
                if (parsed) {
                    totalDeflectRate += parsed.rate;
                    totalDeflectValue += parsed.value;
                }
            }
        }
        return { deflectRate: totalDeflectRate, deflectValue: totalDeflectValue };
    };
    Game_Battler.prototype.hasStateTag = function (tag) {
        if (!this.states)
            return false;
        for (const state of this.states()) {
            if (state.meta[tag]) {
                return true;
            }
        }
        return false;
    };
    Game_Battler.prototype.hasParryQTE = function () {
        if (this.states) {
            for (const state of this.states()) {
                if (state.meta['EnableParryQTE']) {
                    return true;
                }
            }
        }
        if (this.equips) {
            for (const equip of this.equips()) {
                if (equip && equip.meta['EnableParryQTE']) {
                    return true;
                }
            }
        }
        // For enemies: check enemy database note tags
        if (this.enemy) {
            if (this.enemy().meta['EnableParryQTE']) {
                return true;
            }
        }
        return false;
    };
    const _HitCore_Game_ActionResult_initialize = Game_ActionResult.prototype.initialize;
    Game_ActionResult.prototype.initialize = function () {
        _HitCore_Game_ActionResult_initialize.call(this);
        this.blocked = false;
        this.parried = false;
        this.deflected = false;
    };
    const _HitCore_Game_ActionResult_clear = Game_ActionResult.prototype.clear;
    Game_ActionResult.prototype.clear = function () {
        _HitCore_Game_ActionResult_clear.call(this);
        this.blocked = false;
        this.parried = false;
        this.deflected = false;
    };
})();
