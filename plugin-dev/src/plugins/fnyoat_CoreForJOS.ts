//=============================================================================
// fnyoat_CoreForJOS.ts
//=============================================================================

/*:
 * @plugindesc 赤石之旅核心
 * @author fnyoat
 *
 * @help 此插件专供赤石之旅
 * 
 */

Imported = Imported || {};
Imported.fnyoat_CoreForJOS = true;

// TypeScript 不知道 RPG Maker 的全局类
declare class Scene_Load {}

// Node.js 模块（仅在Node环境可用）
const isNode = (typeof require !== 'undefined' && typeof module !== 'undefined') || typeof (window as any).nw !== 'undefined';

if (isNode) {
    const os = require('os');
    const v8 = require('v8');

    function formatBytes(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let i = 0;
        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024;
            i++;
        }
        return `${bytes.toFixed(2)} ${units[i]}`;
    }

    // 缓存昂贵的系统调用结果 —— 单次查询，多处复用
    const cpusList = os.cpus();
    const cpu0 = cpusList[0];
    const totalmem = os.totalmem();
    const freemem = os.freemem();
    const netIfaces = os.networkInterfaces();
    const heapUsed = v8.getHeapStatistics().used_heap_size;

    // 扁平化网络接口 —— 单次遍历收集 IPv4 外部地址
    const netAddrs: string[] = [];
    const ifaceValues = Object.values(netIfaces);
    for (let i = 0; i < ifaceValues.length; i++) {
        const arr = ifaceValues[i] as any[];
        for (let j = 0; j < arr.length; j++) {
            const info = arr[j];
            if (info.family === 'IPv4' && !info.internal) netAddrs.push(info.address);
        }
    }

    const sysInfo = {
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        uptime: (os.uptime() / 3600).toFixed(2) + ' 小时',
        cpus: {
            model: cpu0.model,
            cores: cpusList.length,
            speed: cpu0.speed + ' MHz'
        },
        memory: {
            total: formatBytes(totalmem),
            free: formatBytes(freemem),
            used: formatBytes(totalmem - freemem),
            usage: ((1 - freemem / totalmem) * 100).toFixed(2) + '%',
            heap: formatBytes(heapUsed)
        },
        network: netAddrs,
        user: os.userInfo(),
        loadavg: os.loadavg().map(function (v: number): string { return v.toFixed(2); })
    };

    console.log(getJOSLogo());
    console.groupCollapsed('平台与设备信息(来自os模块等)');

    console.log('%c======== 系统诊断信息 ========', 'font-weight: bold');
    console.log(`平台: ${sysInfo.platform} (${sysInfo.arch})`);
    console.log(`系统版本: ${sysInfo.release}`);
    console.log(`运行时间: ${sysInfo.uptime}`);

    console.log('%c=== CPU ===', 'font-weight: bold');
    console.log(`型号: ${sysInfo.cpus.model}`);
    console.log(`核心数: ${sysInfo.cpus.cores}`);
    console.log(`速度: ${sysInfo.cpus.speed}`);
    console.log(`15分钟负载: ${sysInfo.loadavg.join(' | ')}`);

    console.log('%c=== 内存 ===', 'font-weight: bold');
    console.log(`物理内存: ${sysInfo.memory.used} / ${sysInfo.memory.total} (${sysInfo.memory.usage})`);
    console.log(`V8堆内存: ${sysInfo.memory.heap}`);

    console.groupCollapsed('=== 网络 ===');
    console.log(`IP地址: ${sysInfo.network.join(' | ')}`);
    console.log(`主机名: ${sysInfo.hostname}`);
    console.groupEnd();

    console.groupCollapsed('=== 用户 ===');
    console.log(`用户名: ${sysInfo.user.username}`);
    console.log(`主目录: ${sysInfo.user.homedir}`);
    console.groupEnd();

    console.info('提示：不要向不信任的人展示网络和用户信息\nTip: Don\'t show network and user information to untrusted people.');
    console.groupEnd();

    if (os.freemem() / 1024 / 1024 < 100) {
        console.warn(`你在逗我吗？可用内存只剩 ${Math.floor(os.freemem() / 1024 / 1024)}MB 了怎么玩游戏？`);
    }

    console.info('警告：不要在这里运行任何你不知道功能的JavaScript，否则可能造成财产损失!\nWARN: DO NOT run any JavaScript which is you DON\'t KNOW MEAN!');
}

/**
 * 获取JOS Logo（SSH终端风格ASCII字符画）
 * @return {string} "JOS" ASCII字符画，下方为 "Journey Of the Shit"
 */
function getJOSLogo(): string {
  return `
     ___  ________  ___  ___  ________  ________   _______       ___    ___ 
    |\\  \\|\\   __  \\|\\  \\|\\  \\|\\   __  \\|\\   ___  \\|\\  ___ \\     |\\  \\  /  /| 
    \\ \\  \\ \\  \\|\\  \\ \\  \\\\\\  \\ \\  \\|\\  \\ \\  \\\\ \\  \\ \\   __/|    \\ \\  \\  / / 
  __ \\ \\  \\ \\  \\\\\\  \\ \\  \\\\\\  \\ \\   _  _\\ \\  \\\\ \\  \\ \\  \\_|/__   \\ \\    / / 
 |\\  \\\\_\\  \\ \\  \\\\\\  \\ \\  \\\\\\  \\ \\  \\  \\ \\  \\\\ \\  \\ \\  \\_|\\ \\   \\/  /  /  
 \\ \\________\\ \\_______\\ \\_______\\ \\__\\ _\\ \\__\\ \\__\\ \\_______\\__/  / /    
  \\|________|\\|_______|\\|_______|\\|__|\\|__\\|__| \\|__|\\|_______|\\___/ /     
                                                               \\|___|/      
  ________  ________      _________  ___  ___  _______                      
 |\\   __  \\|\\  _____\\    |\\___   ___\\  \\|\\  \\|\\  ___ \\                     
 \\ \\  \\|\\  \\ \\  \\__/     \\|___ \\  \\_\\ \\  \\\\\\  \\ \\   __/|                    
  \\ \\  \\\\\\  \\ \\   __\\         \\ \\  \\ \\ \\   __  \\ \\  \\_|/__                  
   \\ \\  \\\\\\  \\ \\  \\_|          \\ \\  \\ \\ \\  \\ \\  \\ \\  \\_|\\ \\                 
    \\ \\_______\\ \\__\\            \\ \\__\\ \\ \\__\\ \\__\\ \\_______\\                
     \\|_______|\\|__|             \\|__|  \\|__|\\|__|\\|_______|                
  ________  ___  ___  ___  _________                                        
 |\\   ____\\|\\  \\|\\  \\|\\  \\|\\___   ___\\                                      
 \\ \\  ___|\\ \\  \\\\\\  \\ \\  \\|___ \\  \\_|                                      
  \\ \\_____  \\ \\   __  \\ \\  \\   \\ \\  \\                                       
   \\|____|\\  \\ \\  \\ \\  \\ \\  \\   \\ \\  \\                                      
     ____\\_\\  \\ \\__\\ \\__\\ \\__\\   \\ \\__\\                                     
    |\\_________|\\__|\\|__|\\|__|    \\|__|                                     
    \\|_________|`;
}

// 将 getJOSLogo 挂到 fnyoat 命名空间，便于其他插件/脚本访问
if (typeof fnyoat !== 'undefined') {
    fnyoat.getJOSLogo = getJOSLogo;
}

// ============================================================
//  本地持久化解锁系统（跨存档、永久解锁）
//  优先级：1) NW.js 本地文件 → 2) localStorage（Web部署）
// ============================================================

(function (): void {
    const APP_NAME = 'JourneyOfTheShit';
    const STORE_FILENAME = 'unlock.json';

    function _getPath(): string | null {
        // 优先 NW.js 的用户数据目录
        if (typeof (window as any).nw !== 'undefined') {
            try {
                const gui = (window as any).require ? (window as any).require('nw.gui') : null;
                if (gui && gui.App && gui.App.dataPath) {
                    return gui.App.dataPath + '/' + STORE_FILENAME;
                }
            } catch (e) { /* ignore */ }
        }
        // 回退：用 process.env + fs（RPG MV 的 Node 环境）
        try {
            const proc: any = (window as any).process;
            if (proc && proc.env) {
                let base = proc.env.LOCALAPPDATA || proc.env.APPDATA || proc.env.HOME || proc.env.USERPROFILE;
                if (base) return base + '/' + APP_NAME + '/' + STORE_FILENAME;
            }
        } catch (e) { /* ignore */ }
        return null;
    }

    function _readFileStore(): any {
        const path = _getPath();
        if (!path) return null;
        try {
            const fs: any = (window as any).require ? (window as any).require('fs') : null;
            if (!fs || !fs.existsSync || !fs.readFileSync) return null;
            if (!fs.existsSync(path)) return {};
            const raw = fs.readFileSync(path, 'utf8');
            if (!raw) return {};
            const obj = JSON.parse(raw);
            return obj && typeof obj === 'object' ? obj : {};
        } catch (e) {
            return {};
        }
    }

    function _writeFileStore(data: any): boolean {
        const path = _getPath();
        if (!path) return false;
        try {
            const fs: any = (window as any).require ? (window as any).require('fs') : null;
            if (!fs || !fs.writeFileSync || !fs.mkdirSync) return false;
            // 确保目录存在
            const dir = path.replace(/[\/\\][^\/\\]+$/, '');
            if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (e) {
            return false;
        }
    }

    function _readLS(): any {
        try {
            const raw = localStorage.getItem(APP_NAME);
            if (!raw) return {};
            const obj = JSON.parse(raw);
            return obj && typeof obj === 'object' ? obj : {};
        } catch (e) { return {}; }
    }

    function _writeLS(data: any): boolean {
        try {
            localStorage.setItem(APP_NAME, JSON.stringify(data));
            return true;
        } catch (e) { return false; }
    }

    function _load(): any {
        const fromFile = _readFileStore();
        if (fromFile) return fromFile;
        return _readLS();
    }

    function _save(data: any): void {
        const ok = _writeFileStore(data);
        if (!ok) _writeLS(data);  // 文件写入失败时，回退到 localStorage
    }

    // ============================================================
    //  通用持久化存储 —— fnyoat.store.*
    //  跨存档、跨启动，永久保存在本地文件中
    // ============================================================
    if (typeof (fnyoat as any) !== 'undefined') {
        const storeApi: any = {};

        storeApi.get = function (key: string): any {
            const fresh = _load();
            return fresh ? fresh[key] : undefined;
        };

        storeApi.set = function (key: string, value: any): void {
            const fresh = _load() || {};
            fresh[key] = value;
            _save(fresh);
        };

        storeApi.has = function (key: string): boolean {
            const fresh = _load();
            return !!(fresh && key in fresh);
        };

        storeApi.remove = function (key: string): void {
            const fresh = _load() || {};
            delete fresh[key];
            _save(fresh);
        };

        storeApi.keys = function (): string[] {
            const fresh = _load();
            if (!fresh) return [];
            const list: string[] = [];
            for (const k in fresh) list.push(k);
            return list;
        };

        storeApi.all = function (): any {
            return _load() || {};
        };

        storeApi.clear = function (): void {
            _save({});
        };

        storeApi.path = function (): string | null { return _getPath(); };

        (fnyoat as any).store = storeApi;

        // ============================================================
        //  fnyoat.JOS.start() —— 一键开场演出
        //  调用方式：在 RPG MV 事件脚本里写   fnyoat.JOS.start();
        // ============================================================
        (function (): void {

            // start() 返回的 Promise 的 resolve —— 只有用户选择"退出"时才调用，
            // GUI/TUI/Shell 模式下关闭终端不会触发它，避免误执行调用方的关闭逻辑
            let _startResolve: () => void = null;
            let _exitRequested: boolean = false;

            const _tuiOptions: any[] = [
                { id: 'new_game', label: '新时间线', hint: '(开始全新冒险)' },
                { id: 'load',    label: '载入时间线', hint: '(读取存档)' },
                { id: 'settings', label: '设置',      hint: '(游戏选项)' },
                { id: 'credits', label: '鸣谢表',     hint: '(Staff Credits)' },
                { id: 'exit_term', label: '退出终端', hint: '(返回标题画面)' },
            ];

            // ---------- TUI 子菜单（5 选项，无退出项，Esc → 视为"退出终端"） ----------
            function _showTUIMenu(): Promise<string> {
                return new Promise<string>(function (resolve): void {
                    const options = _tuiOptions.map(function (opt: any): any {
                        return { label: opt.label, hint: opt.hint || '', locked: false };
                    });

                    // 检查是否有存档，有则默认选中"载入时间线"(index 1)
                    let initialSelected: number = undefined;
                    if (typeof DataManager !== 'undefined' && (DataManager as any).isThisGameFile) {
                        for (let i = 1; i <= 20; i++) {
                            if ((DataManager as any).isThisGameFile(i)) {
                                initialSelected = 1;
                                break;
                            }
                        }
                    }

                    fnyoat.Terminal.menu(options, undefined, '─── TUI 模式 ───', '  ↑↓ 选择   Enter 确认   Esc 返回上级', initialSelected).then(function (idx: number): void {
                        if (idx >= 0 && idx < _tuiOptions.length) {
                            resolve(_tuiOptions[idx].id);
                        } else {
                            // Esc/Ctrl+C → 视为"退出终端"
                            resolve('exit_term');
                        }
                    });
                });
            }

            // ---------- 主菜单（供 start() 与 jos 命令共用） ----------
            function _josOnExit(): void {
                fnyoat.Terminal.clear();
                fnyoat.Terminal.error('Goodbye.');
                // 延时后关闭终端，并 resolve start() 返回的 Promise
                // 实际关闭窗口/游戏由调用方在 start().then() 中自行处理
                _exitRequested = true;
                setTimeout(function (): void {
                    fnyoat.Terminal.close();
                }, 300);
            }

            function _showMainMenu(): void {
                fnyoat.Terminal.clear();
                fnyoat.Terminal.println(fnyoat.getJOSLogo());
                fnyoat.Terminal.newLine();
                fnyoat.Terminal.info('Journey of the Shit  Alpha0.9  (c) fnyoat');
                fnyoat.Terminal.newLine();
                const shellUnlocked = !!fnyoat.store.get('shell');
                fnyoat.Terminal.menu([
                    { label: 'GUI',   hint: '(图形化用户界面)' },
                    { label: 'TUI',  hint: '(终端交互界面)' },
                    { label: 'Shell', hint: '(进入Shell)', locked: !shellUnlocked },
                    { label: '退出',  hint: '(关闭游戏)', locked: false, isExit: true },
                ], _josOnExit).then(function (choice: number): void {
                    if (choice === -1 || choice === 3) return;
                    fnyoat.Terminal.clear();

                    if (choice === 0) {
                        fnyoat.Terminal.println('Launching GUI mode ...');
                        fnyoat.Terminal.println('Loading scene: Scene_Map');
                        setTimeout(function (): void {
                            fnyoat.Terminal.println('GUI mode ready.');
                            setTimeout(function (): void {
                                fnyoat.Terminal.close();
                                $gameTemp.reserveCommonEvent(5);
                                SceneManager.push(Scene_Map);
                            }, 400);
                        }, 500);
                        return;
                    }

                    if (choice === 1) {
                        fnyoat.Terminal.println('Initializing TUI environment ...');
                        setTimeout(function (): void {
                            fnyoat.Terminal.println('TUI mode ready.');
                            fnyoat.Terminal.newLine();
                            nextTUI();
                        }, 300);
                        return;
                    }

                    if (choice === 2) {
                        fnyoat.Terminal.println('Developer mode unlocked. Starting shell ...');
                        setTimeout(function (): void {
                            fnyoat.Terminal.shell();
                        }, 250);
                        return;
                    }
                });
            }

            // ---------- TUI 读取界面 → Scene_Load ----------
            function _doTUILoad(slotIndex: number): void {
                if (slotIndex < 0) {
                    nextTUI();
                    return;
                }
                fnyoat.Terminal.close();
                if (typeof DataManager !== 'undefined' && (DataManager as any).drill_GSM_doLoad) {
                    if ((DataManager as any).drill_GSM_doLoad(slotIndex)) {
                        if (typeof SoundManager !== 'undefined' && SoundManager.playLoad) {
                            SoundManager.playLoad();
                        }
                        (SceneManager as any).goto(Scene_Map);
                    }
                } else {
                    if ((DataManager as any).selectSavefileForNewGame) {
                        (DataManager as any).selectSavefileForNewGame();
                    }
                    SceneManager.push(Scene_Load);
                }
            }

            // ---------- TUI 新游戏 → 公共事件27 ----------
            function _doTUINewGame(): void {
                fnyoat.Terminal.println('Creating new timeline ...');
                setTimeout(function (): void {
                    fnyoat.Terminal.close();
                    $gameTemp.reserveCommonEvent(27);
                    SceneManager.push(Scene_Map);
                }, 400);
            }

            // ---------- TUI 设置界面 ----------
            function _showTUISettings(): void {
                // 设置项定义：id 对应 ConfigManager 字段；type 决定调整方式
                const volItems = [
                    { key: 'bgmVolume', label: 'BGM 音量' },
                    { key: 'bgsVolume', label: 'BGS 音量' },
                    { key: 'meVolume',  label: 'ME 音量'  },
                    { key: 'seVolume',  label: 'SE 音量'  },
                ];
                const toggleItems = [
                    { key: 'alwaysDash',     label: '始终奔跑' },
                    { key: 'commandRemember', label: '记忆战斗指令' },
                    { key: 'touchUi',        label: '触控 UI' },
                ];

                // 进入音量调整界面
                function enterVolumeScreen(): void {
                    const W = 38;
                    let selected = 0;
                    const STEP = 10;

                    function render(): void {
                        fnyoat.Terminal.clear();
                        fnyoat.Terminal.setAutoScroll(false);
                        // 标题
                        const title = '── 设置：音量 ──';
                        fnyoat.Terminal.println(' '.repeat(Math.max(0, Math.floor((W - title.length) / 2))) + title, 't-info');
                        fnyoat.Terminal.newLine();
                        fnyoat.Terminal.println('  ←/→ 调整   ↑/↓ 切换项   Enter 返回', 't-dim');
                        fnyoat.Terminal.newLine();
                        for (let i = 0; i < volItems.length; i++) {
                            const val = (window as any).ConfigManager && (window as any).ConfigManager[volItems[i].key] !== undefined
                                ? (window as any).ConfigManager[volItems[i].key]
                                : 100;
                            const v = Math.max(0, Math.min(100, Number(val) || 0));
                            // 20格进度条
                            const barLen = 20;
                            const filled = Math.round((v / 100) * barLen);
                            const bar = '[' + '█'.repeat(filled) + '░'.repeat(barLen - filled) + ']';
                            const numStr = String(v).padStart(3, ' ');
                            const line = (i === selected ? '> ' : '  ') + volItems[i].label.padEnd(10, ' ') + '  ' + bar + '  ' + numStr + '%';
                            fnyoat.Terminal.println(line, i === selected ? 't-success' : undefined);
                        }
                        fnyoat.Terminal.newLine();
                        const backHint = '返回';
                        const backLine = (selected === volItems.length ? '> ' : '  ') + backHint;
                        fnyoat.Terminal.println(backLine, selected === volItems.length ? 't-success' : 't-dim');
                    }

                    function handleKey(ev: KeyboardEvent): boolean {
                        const key = ev.key;
                        if (key === 'Escape') {
                            fnyoat.Terminal.clearKeyHandler();
                            fnyoat.Terminal.setAutoScroll(true);
                            fnyoat.Terminal.clear();
                            _showTUISettings();
                            return true;
                        }
                        if (key === 'ArrowUp') {
                            selected = Math.max(0, selected - 1);
                            render();
                            return true;
                        }
                        if (key === 'ArrowDown') {
                            selected = Math.min(volItems.length, selected + 1);
                            render();
                            return true;
                        }
                        if (key === 'Enter' || key === ' ') {
                            if (selected === volItems.length) {
                                fnyoat.Terminal.clearKeyHandler();
                                fnyoat.Terminal.setAutoScroll(true);
                                fnyoat.Terminal.clear();
                                _showTUISettings();
                            }
                            return true;
                        }
                        if (selected >= volItems.length) return true;
                        // 当前为音量项 → 调整
                        let delta = 0;
                        if (key === 'ArrowRight') delta = +STEP;
                        else if (key === 'ArrowLeft') delta = -STEP;
                        else if (key === '+' || key === '=') delta = +STEP;
                        else if (key === '-' || key === '_') delta = -STEP;
                        if (delta !== 0) {
                            const CM = (window as any).ConfigManager;
                            if (CM) {
                                const cur = Number(CM[volItems[selected].key]) || 0;
                                const next = Math.max(0, Math.min(100, cur + delta));
                                CM[volItems[selected].key] = next;
                                if (typeof CM.save === 'function') CM.save();
                            }
                            render();
                            return true;
                        }
                        return false;
                    }

                    render();
                    fnyoat.Terminal.setKeyHandler(handleKey);
                }

                // 进入开关设置界面
                function enterToggleScreen(): void {
                    const W = 38;
                    let selected = 0;

                    function render(): void {
                        fnyoat.Terminal.clear();
                        fnyoat.Terminal.setAutoScroll(false);
                        const title = '── 设置：其他选项 ──';
                        fnyoat.Terminal.println(' '.repeat(Math.max(0, Math.floor((W - title.length) / 2))) + title, 't-info');
                        fnyoat.Terminal.newLine();
                        fnyoat.Terminal.println('  Enter  切换状态   Esc 返回', 't-dim');
                        fnyoat.Terminal.newLine();
                        for (let i = 0; i < toggleItems.length; i++) {
                            const CM = (window as any).ConfigManager;
                            let val: any = true;
                            if (CM && CM[toggleItems[i].key] !== undefined) val = CM[toggleItems[i].key];
                            const state = val ? 'ON ' : 'OFF';
                            const line = (i === selected ? '> ' : '  ') + toggleItems[i].label.padEnd(12, ' ') + '  [ ' + state + ' ]';
                            fnyoat.Terminal.println(line, i === selected ? 't-success' : undefined);
                        }
                        fnyoat.Terminal.newLine();
                        const backLine = (selected === toggleItems.length ? '> ' : '  ') + '返回';
                        fnyoat.Terminal.println(backLine, selected === toggleItems.length ? 't-success' : 't-dim');
                    }

                    function handleKey(ev: KeyboardEvent): boolean {
                        const key = ev.key;
                        if (key === 'Escape') {
                            fnyoat.Terminal.clearKeyHandler();
                            fnyoat.Terminal.setAutoScroll(true);
                            fnyoat.Terminal.clear();
                            _showTUISettings();
                            return true;
                        }
                        if (key === 'ArrowUp') {
                            selected = Math.max(0, selected - 1);
                            render();
                            return true;
                        }
                        if (key === 'ArrowDown') {
                            selected = Math.min(toggleItems.length, selected + 1);
                            render();
                            return true;
                        }
                        if (key === 'Enter' || key === ' ') {
                            if (selected === toggleItems.length) {
                                fnyoat.Terminal.clearKeyHandler();
                                fnyoat.Terminal.setAutoScroll(true);
                                fnyoat.Terminal.clear();
                                _showTUISettings();
                                return true;
                            }
                            const CM = (window as any).ConfigManager;
                            if (CM) {
                                const cur = CM[toggleItems[selected].key];
                                CM[toggleItems[selected].key] = !cur;
                                if (typeof CM.save === 'function') CM.save();
                            }
                            render();
                            return true;
                        }
                        return false;
                    }

                    render();
                    fnyoat.Terminal.setKeyHandler(handleKey);
                }

                // 设置主菜单：选择分类
                fnyoat.Terminal.menu([
                    { label: '音量设置', hint: '(BGM/BGS/ME/SE)' },
                    { label: '其他选项', hint: '(奔跑/指令/触控)' },
                    { label: '返回',   hint: '(返回上一级)' },
                ]).then(function (idx: number): void {
                    fnyoat.Terminal.clear();
                    if (idx === 0) enterVolumeScreen();
                    else if (idx === 1) enterToggleScreen();
                    else nextTUI(); // 返回（idx === 2 或 -1）
                });
            }

            // ---------- TUI 鸣谢名单 ----------
            // 居中辅助：终端约38字符宽
            function credit(text: string, cls?: string): void {
                const W = 38;
                const pad = Math.max(0, Math.floor((W - text.length) / 2));
                fnyoat.Terminal.println(' '.repeat(pad) + text, cls);
            }

            function _showTUICredits(): void {
                // 禁用自动滚底，让内容从头开始显示
                fnyoat.Terminal.setAutoScroll(false);
                credit('─── 鸣谢名单 ───', 't-info');
                fnyoat.Terminal.println('  ↑↓ 滚动   任意键返回', 't-dim');
                credit('感谢您愿意查看鸣谢名单', 't-dim');
                credit('（排名不分先后）', 't-dim');
                fnyoat.Terminal.newLine();
                credit('── 主要开发团队', 't-info');
                credit('fnyoat');
                credit('白脸（地图）');
                fnyoat.Terminal.newLine();
                credit('── 其他开发者', 't-info');
                credit('李xx（提供建议）');
                fnyoat.Terminal.newLine();
                credit('── 插件作者们', 't-info');
                credit('// 很多功能都依靠插件实现', 't-warn');
                credit('// 感谢插件作者们', 't-warn');
                credit('狐狸');
                credit('Yanfly');
                credit('MashroomCake28');
                credit('Sasuke');
                credit('Yoji Ojima');
                credit('Moghunter');
                credit('Hime');
                credit('まっつUP');
                credit('芯☆淡茹水');
                credit('Galv');
                credit('Jeneeus Guruman');
                credit('sasuke KANNASUKI');
                credit('triacontane 三十烷');
                credit('ru_shalm');
                credit('くらむぼん');
                credit('Mokusei Penguin');
                credit('康娜');
                credit('トリアコンタン');
                credit('村人A');
                credit('ud2');
                credit('卢毅');
                credit('带刺的玫瑰');
                credit('Drill_up');
                credit('VIPArcher');
                credit('Taroxd');
                credit('みこと');
                credit('Hudell');
                credit('Aerosys');
                credit('fnyoat');
                credit('krmbn0576');
                credit('Mr. Trivel');
                fnyoat.Terminal.newLine();
                credit('// 另外感谢英雄翻译插件', 't-warn');
                fnyoat.Terminal.newLine();
                credit('── 赞助者', 't-info');
                credit('// 您能游玩本游戏就已经是很好的支持', 't-warn');
                credit('// 感谢您', 't-warn');
                fnyoat.Terminal.newLine();
                credit('── 后记', 't-info');
                credit('请尽量不要翻译人名', 't-warn');
                credit('避免出现误差', 't-warn');
                credit('作者能够创作出此游戏', 't-success');
                credit('离不开众人的支持', 't-success');
                credit('不胜感激', 't-success');
                fnyoat.Terminal.newLine();
                // 输出完毕，已在最上方。等待任意键返回，方向键用于滚动不触发返回
                fnyoat.Terminal.setWaitAnyKey(function (): void {
                    fnyoat.Terminal.setAutoScroll(true); // 恢复自动滚底
                    fnyoat.Terminal.clear();
                    nextTUI();
                }, ['ArrowUp', 'ArrowDown']);
            }

            // ---------- TUI 循环主入口 ----------
            function nextTUI(): void {
                _showTUIMenu().then(function (id: string): void {
                    if (id === 'exit_term') {
                        fnyoat.Terminal.clear();
                        fnyoat.Terminal.error('TUI session ended.');
                        setTimeout(function (): void {
                            fnyoat.Terminal.shell();
                        }, 300);
                        return;
                    }
                    if (id === 'credits') {
                        _showTUICredits();
                        return;
                    }
                    if (id === 'load') {
                        const maxSlots = (typeof DataManager !== 'undefined' && (DataManager as any).maxSavefiles)
                            ? (DataManager as any).maxSavefiles() : 20;
                        fnyoat.Terminal.showLoadScreen(maxSlots).then(function (slot: number): void {
                            _doTUILoad(slot);
                        });
                        return;
                    }
                    if (id === 'new_game') {
                        _doTUINewGame();
                        return;
                    }
                    if (id === 'settings') {
                        _showTUISettings();
                        return;
                    }
                    // 其他选项（credits）：提示暂未实现，返回循环
                    fnyoat.Terminal.println('[ ' + id + ' ]  暂未实现此选项', 't-warn');
                    setTimeout(function (): void {
                        nextTUI();
                    }, 400);
                });
            }

            // ---------- 主启动函数 ----------
            (fnyoat as any).JOS = {
                start: function (): Promise<void> {
                    // 返回 Promise：用户选择"退出"或终端关闭时 resolve
                    const startPromise = new Promise<void>(function (resolve): void {
                        _startResolve = resolve;
                    });

                    fnyoat.Terminal.open();
                    // 设置终端关闭回调，确保终端关闭时也能触发 start() 的 Promise
                    // 只有用户明确选择"退出"时才 resolve，避免载入存档等操作误触发游戏关闭
                    fnyoat.Terminal.setOnCloseCallback(function (): void {
                        if (_exitRequested && _startResolve) {
                            const r = _startResolve;
                            _startResolve = null;
                            r();
                        }
                    });

                    // 给 jos 命令注册回调：清屏 → 打印欢迎 → 进入主菜单
                    fnyoat.Terminal.setJosMenuHandler(function (): void {
                        fnyoat.Terminal.clear();
                        fnyoat.Terminal.println(fnyoat.getJOSLogo());
                        fnyoat.Terminal.newLine();
                        fnyoat.Terminal.info('Journey of the Shit  v1.0  (c) fnyoat');
                        fnyoat.Terminal.newLine();
                        setTimeout(function (): void {
                            _showMainMenu();
                        }, 300);
                    });

                    fnyoat.Terminal.println('Initializing JOS kernel ...');
                    const modules = [
                        'kernel', 'file system', 'battle.qte',
                        'window.gui', 'audio.pcm', 'network stack',
                        'security module', 'shell',
                    ];
                    let modIdx = 0;
                    function _printNextModule(): void {
                        if (modIdx >= modules.length) {
                            setTimeout(function (): void {
                                fnyoat.Terminal.newLine();
                                fnyoat.Terminal.success('All modules loaded. System ready.');
                                fnyoat.Terminal.newLine();
                                fnyoat.Terminal.println('  kernel : v0.9.1-JOS');
                                fnyoat.Terminal.println('  shell  : v2.3.1  (TTY mode)');
                                fnyoat.Terminal.println('  battle : v1.2.0');
                                fnyoat.Terminal.newLine();
                                setTimeout(function (): void {
                                    _showMainMenu();
                                }, 700);
                            }, 200);
                            return;
                        }
                        fnyoat.Terminal.println('[ OK ]  ' + modules[modIdx]);
                        modIdx++;
                        setTimeout(_printNextModule, 180);
                    }
                    _printNextModule();

                    return startPromise;  // 仅"退出"时 resolve
                } // end start()
            }; // end JOS
        })(); // end IIFE

    }
})();
