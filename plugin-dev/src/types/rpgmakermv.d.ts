// RPG Maker MV 核心类型声明
// 这个文件给 TypeScript 提供 RPG Maker MV 的全局类型
// 使用宽松的 any 策略，让我们专注于代码结构而不是类型细节

declare global {
    // ====== 全局变量 ======
    var $gameMap: any;
    var $gameParty: any;
    var $gamePlayer: any;
    var $gameVariables: any;
    var $gameSwitches: any;
    var $dataItems: any;
    var $dataSkills: any;
    var $dataWeapons: any;
    var $dataArmors: any;
    var $dataEnemies: any;
    var $dataActors: any;
    var $dataStates: any;
    var $dataSystem: any;
    var $dataClasses: any;
    var $dataTroops: any;
    var $dataCommonEvents: any;
    var $dataMapInfos: any;
    var $gameTemp: any;
    var $gameSystem: any;
    var $gameScreen: any;
    var $gameMessage: any;
    var $gameTroop: any;
    var $gameTimer: any;
    var $gameSelfSwitches: any;

    // ====== 插件系统 ======
    interface PluginManager {
        // PluginManager.parameters("插件名") 返回该插件的参数对象
        // 使用 any 避免繁琐的类型检查
        parameters: any;
        setParameters(name: string, params: any): void;
    }

    var PluginManager: PluginManager;

    var Imported: { [key: string]: boolean };

    // ====== 场景管理 ======
    interface SceneManager {
        _scene: any;
        push(scene: any): void;
        pop(): void;
        update(): void;
        updateMain(): void;
        updateScene(): void;
        changeScene(): void;
        isBusy(): boolean;
    }

    var SceneManager: SceneManager;

    // ====== 图形系统 ======
    interface Graphics {
        width: number;
        height: number;
        _width: number;
        _height: number;
        boxWidth: number;
        boxHeight: number;
        render: any;
    }

    var Graphics: Graphics;

    // ====== 输入系统 ======
    interface Input {
        _onKeyDown: (event: any) => void;
        keyMapper: { [key: string]: string };
        isTriggered(key: string): boolean;
        isPressed(key: string): boolean;
        isRepeated(key: string): boolean;
        getLastCharacter(): string;
        _lastCharacter: string;
    }

    var Input: Input;

    // ====== 触控系统 ======
    interface TouchInput {
        isTriggered(): boolean;
        isPressed(): boolean;
        _onTrigger: ((x: number, y: number) => void) | null;
    }

    var TouchInput: TouchInput;

    // ====== 事件解释器 ======
    interface Game_Interpreter {
        pluginCommand: (command: string, args: string[]) => void;
        clear(): void;
    }

    var Game_Interpreter: { prototype: Game_Interpreter };

    // ====== 音频管理 ======
    interface AudioManager {
        playSe(audio: any): void;
        playBgm(audio: any): void;
        playBgs(audio: any): void;
        playMe(audio: any): void;
        stopBgm(): void;
        stopBgs(): void;
        stopMe(): void;
        stopSe(): void;
        fadeOutBgm(duration: number): void;
    }

    var AudioManager: AudioManager;

    // ====== fnyoat 命名空间 ======
    interface Window {
        fnyoat: any;
        fnot: any;
        nw: any;
    }

    var fnyoat: any;
    var fnot: any;
    var nw: any;

    // ====== 仇恨系统 ======
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

    interface HateSystem {
        getEnemyHate(enemyIndex: number): HateEntry[] | null;
        getHate(enemyIndex: number, actorId: number): number;
        setHate(enemyIndex: number, actorId: number, value: number): void;
        addHate(enemyIndex: number, actorId: number, value: number, type?: 'damage' | 'heal'): void;
        taunt(enemyIndex: number, actorId: number): void;
        isTaunted(enemyIndex: number): boolean;
        copyHateToTop(sourceActorId: number, targetEnemyIndex: number): void;
        resetAll(): void;
        getBattleStats(): BattleStat[];
        selectTargetWithHate(enemyIndex: number): number;
        decayHate(): void;
        _system: any;
    }

    // ====== 战斗面板 ======
    interface BattlePanel {
        open(): void;
        close(): void;
        isOpen(): boolean;
        update(): void;
        _panel: any;
    }

    // ====== 仇恨面板 ======
    interface HatePanel {
        open(): void;
        close(): void;
        isOpen(): boolean;
        setEnemyIndex(index: number): void;
        getCurrentEnemyIndex(): number;
        update(): void;
        _panel: any;
    }

    // ====== 物理对象 ======
    interface PhysicsObject {
        new(x?: number, y?: number, config?: any): any;
        update(): void;
        getCurrentX(): number;
        getCurrentY(): number;
        getOpacity(): number;
        isGone(): boolean;
    }

    // ====== 战斗系统 ======
    interface BattleManager {
        _subject: any;
        _action: any;
        _targets: any[];
        _logWindow: any;
        _phase: string;
        startAction(): void;
        startBattle(): void;
        endBattle(): void;
        updateAction(): void;
        endAction(): void;
        setup(troopId: number, canEscape: boolean, canLose: boolean): void;
        checkBattleEnd(): boolean;
    }

    var BattleManager: BattleManager;

    // ====== 场景类 ======
    interface Scene_Base {
        initialize(): void;
        create(): void;
        update(): void;
        terminate(): void;
        start(): void;
        isReady(): boolean;
        isBusy(): boolean;
    }

    var Scene_Base: { prototype: Scene_Base };

    interface Scene_Map extends Scene_Base {
        onMapLoaded(): void;
    }

    var Scene_Map: { prototype: Scene_Map };

    interface Scene_Title extends Scene_Base {
    }

    var Scene_Title: { prototype: Scene_Title };

    interface Scene_Battle extends Scene_Base {
        create(): void;
        update(): void;
        terminate(): void;
        setupQTEListeners(): void;
        onQTEKeyDown(event: any): void;
        _qteKeyHandler: any;
    }

    var Scene_Battle: { prototype: Scene_Battle };

    interface Scene_Menu extends Scene_Base {
    }

    var Scene_Menu: { prototype: Scene_Menu };

    // ====== 窗口类 ======
    interface Window_BattleLog {
        updateWaitMode(): boolean;
        _waitMode: string;
        displayEvasion(target: any): void;
        displayCritical(target: any): void;
        displayDamage(target: any): void;
        displayFailure(target: any): void;
    }

    var Window_BattleLog: { prototype: Window_BattleLog };

    interface Window_Command {
        addCommand(name: string, symbol: string, enabled?: boolean, ext?: any): void;
    }

    var Window_Command: { prototype: Window_Command };

    interface Window_EquipItem {
        _actor: any;
        _slotId: number;
        setActor(actor: any): void;
        setSlotId(slotId: number): void;
        includes(item: any): boolean;
        isEnabled(item: any): boolean;
        refresh(): void;
        resetScroll(): void;
    }

    var Window_EquipItem: { prototype: Window_EquipItem };

    interface Window_Base {
        new(x: number, y: number, width: number, height: number): any;
        drawText(text: string, x: number, y: number, width?: number, align?: string): void;
        drawTextEx(text: string, x: number, y: number, width: number, height: number): number;
        textWidth(text: string): number;
        standardFontSize(): number;
        opacity: number;
        visible: boolean;
        padding: number;
        _windowContentsSprite: any;
        addChild(child: any): void;
        update(): void;
    }

    var Window_Base: { prototype: Window_Base; new(x: number, y: number, width: number, height: number): any };

    // ====== 行为类 ======
    interface Game_Action {
        item(): any;
        subject(): any;
        targets(): any[];
        itemHit(target: any): number;
        calcDamage(target: any): number;
        _qteResult: any;
        setValue(damage: number): void;
        evaluate(): number;
        apply(target: any): void;
    }

    var Game_Action: { prototype: Game_Action };

    interface Game_Enemy {
        name(): string;
    }

    var Game_Enemy: { prototype: Game_Enemy };

    interface Game_Actor {
        name(): string;
        equipSlots(): number[];
        equips(): any[];
        _equips: any[];
        changeEquip(slotId: number, item: any): void;
        forceChangeEquip(slotId: number, item: any): void;
        changeEquipById(etypeId: number, itemId: number): void;
        releaseUnequippableItems(forcing: boolean): void;
        bestEquipItem(slotId: number): any;
        calcEquipItemPerformance(item: any): number;
        canEquip(item: any): boolean;
        isEquipChangeOk(slotId: number): boolean;
        tradeItemWithParty(newItem: any, oldItem: any): boolean;
        refresh(): void;
        optimizeEquipments(): void;
        clearEquipments(): void;
    }

    var Game_Actor: { prototype: Game_Actor };

    interface Game_Battler {
        new(): any;
        actorId(): number;
        isActor(): boolean;
        isEnemy(): boolean;
        isAlive(): boolean;
        hp: number;
        mhp: number;
        eva: number;
        mev: number;
        hit: number;
        addState(stateId: number): void;
        removeState(stateId: number): void;
        states(): any[];
        gainHp(value: number): void;
        equips(): any[];
        result(): any;
    }

    var Game_Battler: { prototype: Game_Battler };

    interface Game_BattlerBase {
        new(): any;
        xparam(index: number): number;
    }

    var Game_BattlerBase: { prototype: Game_BattlerBase };

    interface Game_ActionResult {
        new(): any;
        initialize(): void;
        clear(): void;
        used: boolean;
        missed: boolean;
        evaded: boolean;
        critical: boolean;
        hpDamage: number;
        isHit(): boolean;
        blocked?: boolean;
        parried?: boolean;
        blockValue?: number;
        parryValue?: number;
    }

    var Game_ActionResult: { prototype: Game_ActionResult };

    interface Sprite_Damage {
        new(): any;
        setup(target: any): void;
        update(): void;
        createMiss(): void;
        createDigits(baseRow: number, value: number): void;
        createChildSprite(): any;
        digitWidth(): number;
        digitHeight(): number;
        addChild(child: any): void;
        children: any[];
        _result: any;
    }

    var Sprite_Damage: { prototype: Sprite_Damage };

    interface Sprite_Battler extends Sprite {
        _battler: any;
        initMembers(): void;
        update(): void;
    }

    var Sprite_Battler: { prototype: Sprite_Battler };

    // ====== 精灵类 ======
    class Sprite {
        constructor();
        x: number;
        y: number;
        width: number;
        height: number;
        opacity: number;
        rotation: number;
        scale: { x: number; y: number };
        anchor: { x: number; y: number };
        bitmap: any;
        parent: any;
        addChild(child: any): void;
        removeChild(child: any): void;
        clear(): void;
        update(): void;
        // 动态属性（在 BattleQTE 等插件中使用）
        indicator?: any;
        index?: number;
    }

    // ====== 位图类 ======
    class Bitmap {
        constructor(width: number, height: number);
        width: number;
        height: number;
        context: any;
        _dirty: boolean;
        fontSize: number;
        fontWeight: string;
        textColor: string;
        outlineWidth: number;
        outlineColor: string;
        fillRect(x: number, y: number, width: number, height: number, color: string): void;
        clear(): void;
        clearRect(x: number, y: number, width: number, height: number): void;
        strokeRect(x: number, y: number, width: number, height: number, color: string): void;
        blt(source: Bitmap, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw?: number, dh?: number): void;
        drawText(text: string, x: number, y: number, maxWidth: number, lineHeight: number, align?: string): void;
        drawIcon(iconIndex: number, x: number, y: number): void;
    }

    // ====== 窗口类 ======
    class Window {
        constructor();
        x: number;
        y: number;
        width: number;
        height: number;
        opacity: number;
        contents: Bitmap;
        contentsOpacity: number;
        visible: boolean;
        active: boolean;
        select(index: number): void;
        deactivate(): void;
        activate(): void;
        close(): void;
        open(): void;
        isOpen(): boolean;
        isClosed(): boolean;
    }

    // ====== Math 扩展（RPG Maker MV 添加的辅助方法）======
    interface Math {
        // 接受 1 个参数（0 到 max）或 2 个参数（min 到 max）
        randomInt(...args: number[]): number;
    }

    // ====== String 扩展（包含 ES2015/ES2016 以及自定义方法）======
    interface String {
        contains(searchString: string, position?: number): boolean;
        padStart(targetLength: number, padString?: string): string;
        padEnd(targetLength: number, padString?: string): string;
        startsWith(searchString: string, position?: number): boolean;
        endsWith(searchString: string, position?: number): boolean;
        includes(searchString: string, position?: number): boolean;
    }

    // ====== Array 扩展 ======
    interface Array<T> {
        includes(searchElement: T, fromIndex?: number): boolean;
        find(predicate: (value: T, index: number, obj: T[]) => boolean, thisArg?: any): T | undefined;
        findIndex(predicate: (value: T, index: number, obj: T[]) => boolean, thisArg?: any): number;
    }

    // ====== Object 扩展 ======
    interface ObjectConstructor {
        values(o: any): any[];
        entries(o: any): [string, any][];
    }

    // ====== JSON 状态管理 ======
    interface JsonEx {
        parse(str: string): any;
        stringify(value: any, depth?: number): string;
    }

    var JsonEx: JsonEx;

    // ====== 数据管理器 ======
    interface DataManager {
        isDatabaseLoaded(): boolean;
        saveGame(savefileId: number): boolean;
        loadGame(savefileId: number): boolean;
        extractSaveContents(contents: any): void;
        isWeapon(item: any): boolean;
        isArmor(item: any): boolean;
        isItem(item: any): boolean;
        isSkill(item: any): boolean;
    }

    var DataManager: DataManager;

    // ====== Config 管理器 ======
    interface ConfigManager {
        [key: string]: any;
        save(): void;
        load(): void;
    }

    var ConfigManager: ConfigManager;

    // ====== SoundManager ======
    interface SoundManager {
        playCursor(): void;
        playOk(): void;
        playCancel(): void;
        playBuzzer(): void;
        playDecision(): void;
        playLoad(): void;
        playSave(): void;
    }

    var SoundManager: SoundManager;

    // ====== RPG Maker MV 常用的 PIXI 简化声明 ======
    interface PIXI {
        Sprite: any;
        Bitmap: any;
        CanvasRenderer: any;
        WebGLRenderer: any;
        Graphics: any;
    }

    var PIXI: PIXI;
}

export {};
