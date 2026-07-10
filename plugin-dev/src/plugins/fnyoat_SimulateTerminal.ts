//=============================================================================
// fnyoat_SimulateTerminal.ts
//=============================================================================

/*:
 * @plugindesc [Terminal] 模拟 Linux 终端 —— 黑底白字、原生滚动条、Ctrl+C 中断、程序执行
 * @author fnyoat
 *
 * @help
 * ============================================================================
 * 简介
 * ============================================================================
 * 一个更贴近真实终端的模拟器：
 *   • 黑底白字，等宽字体
 *   • 使用浏览器原生滚动条（软件级），不自行绘制
 *   • 支持 Ctrl+C 中断正在运行的程序（输出 ^C）
 *   • 程序执行模型：通过 run(executor) 运行任意脚本，内部可 await ctx.sleep()
 *     每次 await/yield 时都会检测中断标志，被中断时框架会自动输出 ^C 并恢复
 *   • 交互式 Shell：调用 shell() 进入，用户可输入命令并回车执行
 *   • 命令历史：↑ / ↓ 切换历史命令
 *   • 内置命令：help / clear / cls / echo / exit / history / whoami / date / sleep / scan
 *
 * ============================================================================
 * 脚本接口
 * ============================================================================
 *
 *   fnyoat.Terminal.open()                     —— 打开终端
 *   fnyoat.Terminal.close()                    —— 关闭终端
 *   fnyoat.Terminal.isOpen()                   —— 是否打开
 *   fnyoat.Terminal.print(text)                —— 追加一行文本
 *   fnyoat.Terminal.println(text)              —— 同上
 *   fnyoat.Terminal.write(text)                —— 在当前行继续写（不换行）
 *   fnyoat.Terminal.newLine()                  —— 仅输出一个空行
 *   fnyoat.Terminal.clear()                    —— 清屏
 *   fnyoat.Terminal.undoLines(n)               —— 撤回最后 n 行
 *   fnyoat.Terminal.info(text)                 —— 灰色信息行
 *   fnyoat.Terminal.success(text)              —— 绿色成功行
 *   fnyoat.Terminal.warn(text)                 —— 黄色警告行
 *   fnyoat.Terminal.error(text)                —— 红色错误行
 *
 *   // 可中断的程序执行：
 *   await fnyoat.Terminal.run(async (ctx) => {
 *       ctx.println('Scanning ...');
 *       for (let i = 0; i < 10; i++) {
 *           ctx.println('  item ' + i + '  ... OK');
 *           await ctx.sleep(150);     // 每次 sleep 都会检测 Ctrl+C
 *       }
 *       ctx.success('done');
 *   });
 *
 *   // ctx 可用方法：
 *   ctx.println / ctx.write / ctx.newLine
 *   ctx.info / ctx.success / ctx.warn / ctx.error
 *   ctx.sleep(ms) / ctx.yield()                —— 睡眠/让出，并检测中断
 *   ctx.clear() / ctx.isInterrupted() / ctx.onInterrupt(fn)
 *
 *   // Shell：
 *   fnyoat.Terminal.shell()                    —— 进入交互式 shell
 *   fnyoat.Terminal.registerCommand(name, fn)  —— 注册自定义命令
 *   fnyoat.Terminal.unregisterCommand(name)
 *   fnyoat.Terminal.setPrompt(prompt)          —— 设置提示符（默认 "$ "）
 *   fnyoat.Terminal.history()                  —— 获取历史命令数组
 *   fnyoat.Terminal.interrupt()                —— 以编程方式触发中断
 *
 * ============================================================================
 * 插件命令（可选）
 * ============================================================================
 *   SimTerminal open        打开终端并进入 shell
 *   SimTerminal close       关闭终端
 *   SimTerminal echo text   输出一行 text
 *   SimTerminal clear       清屏
 */

// ============================================================
// 全局声明 —— 让 TypeScript 知道 fnyoat 存在
// （在 RPG Maker MV 中由多个插件共同挂载，按插件顺序加载）
// ============================================================

declare var fnyoat: any;
declare var Imported: any;
declare var Scene_Base: any;
declare var Game_Interpreter: any;
declare var Input: any;

Imported = Imported || {};
Imported.fnyoat_SimulateTerminal = true;

// 确保 window.fnyoat 存在
window.fnyoat = window.fnyoat || {};

// ============================================================
//  RPG Maker 事件解释器冻结系统
//  open() 时冻结，close() 时解冻，防止终端运行时背景事件并行执行
// ============================================================
(function (): void {
    let _gameFreezeDepth = 0;
    const _orig_Game_Interpreter_update = Game_Interpreter.prototype.update;

    function _freezeGame(): void {
        _gameFreezeDepth++;
    }

    function _unfreezeGame(): void {
        if (_gameFreezeDepth > 0) _gameFreezeDepth--;
    }

    function _isGameFrozen(): boolean {
        return _gameFreezeDepth > 0;
    }

    // 全局挂载，供闭包内各函数调用
    (window as any).__fnyoat_terminalFreeze = _freezeGame;
    (window as any).__fnyoat_terminalUnfreeze = _unfreezeGame;
    (window as any).__fnyoat_isTerminalFrozen = _isGameFrozen;

    // 打补丁：所有 Game_Interpreter 实例的 update，每帧检查冻结计数
    // 确保游戏地图/事件指令完全停止，直到终端 close() 为止
    Game_Interpreter.prototype.update = function (): void {
        if (_isGameFrozen()) return;
        _orig_Game_Interpreter_update.call(this);
    };
})();

// ============================================================
// 类型
// ============================================================

interface TerminalCtx {
    println(text?: string): void;
    write(text: string): void;
    newLine(): void;
    clear(): void;
    info(text: string): void;
    success(text: string): void;
    warn(text: string): void;
    error(text: string): void;
    sleep(ms: number): Promise<void>;
    yield(): Promise<void>;
    isInterrupted(): boolean;
    onInterrupt(callback: () => void): void;
}

interface TermCommandHandler {
    (args: string[], ctx: TerminalCtx): void | Promise<void>;
}

interface TerminalMenuOption {
    label: string;      // 显示的文本，如 "GUI"
    locked?: boolean;   // true = 未解锁，不可选，且在菜单中不显示
    hint?: string;     // 可选，右侧提示，如 "(RPG Maker 普通游戏)"
    isExit?: boolean;  // true = 退出项（Esc 键在未选中退出项时会导航到此处）
}

interface _MenuState {
    options: TerminalMenuOption[];          // 原始选项（含 locked）
    renderedIndices: number[];               // 渲染行 → 原始 options 索引
    selected: number;                         // 当前选中（渲染行索引）
    lineCount: number;                        // 总渲染行数（含标题行）
    titleLineCount: number;                   // 标题行数（不含标题时为0）
    startLine: number;
    resolve: (index: number) => void;        // 传入原始 options 索引
    onExit: (() => void) | null;              // 退出项被确认时调用
    timer: number;
    blinkOn: boolean;
}

// ============================================================
// 主模块 —— 自执行函数，所有函数 / 状态封装在闭包中
// 对外统一挂在 fnyoat.Terminal 上
// ============================================================

(function (): void {

    // ---------- 状态 ----------

    let _isOpen = false;
    let _root: HTMLDivElement | null = null;
    let _output: HTMLDivElement | null = null;
    let _inputRow: HTMLDivElement | null = null;
    let _promptSpan: HTMLSpanElement | null = null;
    let _inputSpan: HTMLSpanElement | null = null;
    let _cursorSpan: HTMLSpanElement | null = null;
    let _inputAfterSpan: HTMLSpanElement | null = null;
    let _pasteInput: HTMLInputElement | null = null;

    let _cursorVisible = true;
    let _cursorTimer = 0;
    let _cursorBlinkRate = 500;
    let _cursorTickerId: any = 0;

    let _inputBuffer = '';
    let _cursorPos = 0;
    let _inputEnabled = false;
    let _inputIsPassword = false;
    let _inputCallback: ((line: string) => void) | null = null;
    let _inputMode: 'idle' | 'prompt' | 'shell' | 'run' | 'menu' | 'tui_load' | 'wait_any' | 'external' | 'search' = 'idle';
    let _waitAnyCallback: (() => void) | null = null;
    let _waitAnyExclude: string[] = [];
    let _autoScroll = true;  // false 时 _smartScroll 不执行自动滚底（用于长文本展示）
    let _externalKeyHandler: ((ev: KeyboardEvent) => boolean) | null = null;
    let _promptText = '$ ';

    let _history: string[] = [];
    let _historyIndex = -1;
    let _isExecutingHistory = false;

    let _interruptRequested = false;
    let _interruptCallbacks: Array<() => void> = [];
    let _isRunningProgram = false;

    let _currentShellActive = false;
    let _bootTime = Date.now();
    // Object.create(null) 没有原型链，彻底避免命令名命中 Object.prototype 上的属性
    let _commands: { [name: string]: TermCommandHandler } = Object.create(null);
    let _currentUser = 'player';              // 当前登录用户，默认为 player
    // login 状态机：null = 空闲；'username' = 等待输入用户名；'password' = 等待输入密码
    let _loginState: null | { user: string; attempts: number } = null;
    let _josMenuHandler: (() => void) | null = null;   // jos 命令：打开主菜单的回调
    let _closeResolve: (() => void) | null = null;     // open() 返回的 Promise 的 resolve
    let _onCloseCallback: (() => void) | null = null;   // 终端关闭时的回调
    let _sudoCache: { [user: string]: number } = Object.create(null);  // sudo 缓存：用户 -> 过期时间戳
    const _ROOT_PASSWORD = 'root';
    let _suState: null | { targetUser: string; attempts: number } = null;  // su 状态：等待密码输入
    let _sudoState: null | { targetUser: string; command: string[] } = null;  // sudo 状态：等待密码输入
    let _authFailureCount = 0;  // 全局密码错误计数
    let _authLockedUntil = 0;   // 锁定截止时间戳（0 = 未锁定）
    const _MAX_AUTH_ATTEMPTS = 3;  // 最大尝试次数
    const _AUTH_LOCK_DURATION = 60000;  // 锁定时长（60秒）

    // TUI 读取界面状态
    let _loadScreenState: {
        maxSlots: number;
        selected: number;
        page: number;
        itemsPerPage: number;
        totalPages: number;
        startLine: number;
        resolve: (index: number) => void;  // 返回存档槽索引（1-based），-1 = 取消
        errorMessage: string;
    } | null = null;
    let _loadSelectedEl: HTMLElement | null = null;  // 选中槽的 DOM 元素，用于 scrollIntoView
    // TUI 读取界面：按键重复节流（解决长按时卡顿）
    let _loadRepeatTimer: ReturnType<typeof setInterval> | null = null;
    let _loadRepeatDir: number = 0;  // 1 = 向下，-1 = 向上
    let _loadRepeatStop: boolean = false;  // keyup 后软停止：阻止 interval 再次触发移动
    let _loadRepeatKeyDownTime: number = 0;  // 记录上次 keydown 时间，防止旧 timer 触发
    const _LOAD_REPEAT_RATE_MS = 60;

    // ---------- 虚拟文件系统状态 ----------
    // 虚拟游戏根路径
    const _virtualGameRoot = '/home/player/game';
    let _currentDir = _virtualGameRoot;

    // 尝试获取真实游戏根目录（Windows 路径）
    function _getRealGameRoot(): string | null {
        // 优先尝试 NW.js process.cwd()
        try {
            const proc: any = (window as any).process;
            if (proc && typeof proc.cwd === 'function') {
                const cwd: string = proc.cwd();
                if (cwd && cwd.length > 2 && cwd.charAt(1) === ':') return cwd;
            }
        } catch (e) { /* ignore */ }
        // NW.js 备用：gui.App.startPath
        try {
            const gui: any = (window as any).require ? (window as any).require('nw.gui') : null;
            if (gui && gui.App && gui.App.startPath) {
                const p: string = gui.App.startPath;
                if (p && p.length > 0) return p;
            }
        } catch (e) { /* ignore */ }
        return null;
    }
    const _realGameRoot: string | null = _getRealGameRoot();

    // 虚拟路径 -> 真实文件系统路径
    function _vfsToReal(virtualPath: string): string | null {
        if (!_realGameRoot) return null;
        const v = _normalizeVirtualPath(virtualPath);
        // 游戏根目录本身 -> 真实游戏根目录
        if (v === _virtualGameRoot) return _realGameRoot;
        // 子目录：去掉 /home/player/game/ 前缀后拼接
        const prefix = _virtualGameRoot + '/';
        if (!v.startsWith(prefix)) return null;
        const rel = v.substring(prefix.length).replace(/\//g, '\\');
        const real = _realGameRoot + '\\' + rel;
        // 过滤 Windows 保留设备名：CON, PRN, AUX, NUL, CONIN$, CONOUT$, COM1-COM9, LPT1-LPT9
        // 大小写不敏感，防止 cat CON / cat con / cat Con 等各种变体
        const filename = rel.replace(/^.*[\\\/]/, '').toUpperCase();
        if (/^(CON|PRN|AUX|NUL|CONIN\$|CONOUT\$|COM[1-9]|LPT[1-9])(\.|;|:|$)/.test(filename)) return null;
        return real;
    }

    // ---------- 真实磁盘操作（仅限游戏根目录下） ----------
    function _realFsModule(): any {
        return (window as any).require ? (window as any).require('fs') : null;
    }
    function _realIsDir(absVirtual: string): boolean {
        const real = _vfsToReal(absVirtual);
        if (!real) return false;
        try {
            const fs: any = _realFsModule();
            return fs && fs.statSync && fs.statSync(real).isDirectory();
        } catch (e) { return false; }
    }
    function _realIsFile(absVirtual: string): boolean {
        const real = _vfsToReal(absVirtual);
        if (!real) return false;
        try {
            const fs: any = _realFsModule();
            return fs && fs.statSync && fs.statSync(real).isFile();
        } catch (e) { return false; }
    }
    function _realGetSize(absVirtual: string): number {
        const real = _vfsToReal(absVirtual);
        if (!real) return -1;
        try {
            const fs: any = _realFsModule();
            if (!fs || !fs.statSync) return -1;
            return fs.statSync(real).size;
        } catch (e) { return -1; }
    }
    function _realExists(absVirtual: string): boolean {
        const real = _vfsToReal(absVirtual);
        if (!real) return false;
        try {
            const fs: any = _realFsModule();
            return !!(fs && fs.existsSync && fs.existsSync(real));
        } catch (e) { return false; }
    }
    function _realListDir(absVirtual: string): string[] {
        const real = _vfsToReal(absVirtual);
        if (!real) return [];
        try {
            const fs: any = _realFsModule();
            if (!fs || !fs.readdirSync) return [];
            return fs.readdirSync(real);
        } catch (e) { return []; }
    }
    function _realReadFile(absVirtual: string): string | null {
        const real = _vfsToReal(absVirtual);
        if (!real) return null;
        try {
            const fs: any = _realFsModule();
            if (!fs || !fs.readFileSync) return null;
            return fs.readFileSync(real, 'utf8');
        } catch (e) { return null; }
    }

    // ---------- 兼容层（仍用 _virtualDirs 等名字，但内部走真实磁盘） ----------
    // 游戏根目录外的目录认为不存在（cd 时需要检查）
    function _vfsIsDir(absVirtual: string): boolean {
        if (_isOutsideGameRoot(absVirtual)) return false;
        return _realIsDir(absVirtual);
    }
    function _vfsIsFile(absVirtual: string): boolean {
        if (_isOutsideGameRoot(absVirtual)) return false;
        return _realIsFile(absVirtual);
    }
    function _vfsExists(absVirtual: string): boolean {
        if (_isOutsideGameRoot(absVirtual)) return false;
        return _realExists(absVirtual);
    }
    function _vfsListDir(absVirtual: string): string[] {
        if (_isOutsideGameRoot(absVirtual)) return [];
        return _realListDir(absVirtual);
    }
    function _vfsReadFile(absVirtual: string): string | null {
        if (_isOutsideGameRoot(absVirtual)) return null;
        return _realReadFile(absVirtual);
    }
    function _vfsJoinDir(absDir: string, name: string): string {
        return _normalizeVirtualPath(absDir + '/' + name);
    }

    let _menuState: _MenuState | null = null;

    // body / html 原始样式快照 —— open() 时保存，close() 时还原
    let _savedHtmlStyle = '';
    let _savedBodyStyle = '';
    let _savedBodyChildrenHidden: Array<{ el: HTMLElement; display: string }> = [];

    // ---------- 样式表 —— 只注入一次 ----------

    function _injectStyle(): void {
        if (document.getElementById('fnyoat-terminal-style')) return;
        const style = document.createElement('style');
        style.id = 'fnyoat-terminal-style';
        style.textContent =
            '#fnyoat-terminal{position:static;width:100%;min-height:100%;background:#000;color:#d1d5db;' +
            'font-family:"Consolas","Menlo","Courier New",monospace;font-size:16px;' +
            'line-height:1.4;display:flex;flex-direction:column;' +
            '-webkit-user-select:text;user-select:text;cursor:text;' +
            'box-sizing:border-box;padding:0;}' +
            '#fnyoat-terminal-output{flex:1 1 auto;padding:2px 2px 0 2px;' +
            'white-space:pre-wrap;word-break:break-all;}' +
            '.t-line{display:block;white-space:pre-wrap;word-break:break-all;' +
            'min-height:1.4em;}' +
            '.t-info{color:#9aa0a6;}.t-success{color:#34d399;}' +
            '.t-warn{color:#fbbf24;}.t-error{color:#f87171;}' +
            '.t-dim{color:#6b7280;}' +
            '#fnyoat-terminal-input-row{display:block;position:relative;' +
            'padding:0 2px 12px 2px;background:#000;white-space:pre-wrap;word-break:break-all;}' +
            '#fnyoat-terminal-input-row.hidden{display:none;}' +
            '#fnyoat-terminal-prompt{color:#d1d5db;margin-right:0;display:inline;}' +
            '#fnyoat-terminal-input{color:#d1d5db;display:inline;}' +
            '#fnyoat-terminal-input-after{color:#d1d5db;display:inline;}' +
            '#fnyoat-terminal-input-container{display:inline;}' +
            '#fnyoat-terminal-cursor{display:inline-block;width:1ch;height:1em;' +
            'background:#d1d5db;color:#000;line-height:1em;' +
            'margin-left:-1ch;}' +
            '.cursor-hidden #fnyoat-terminal-cursor{visibility:hidden;}' +
            '.no-cursor #fnyoat-terminal-cursor{display:none;}';
        document.head.appendChild(style);
    }

    // ---------- DOM 构造 / 销毁 ----------

    function _buildDom(): void {
        _injectStyle();

        const root = document.createElement('div');
        root.id = 'fnyoat-terminal';

        const output = document.createElement('div');
        output.id = 'fnyoat-terminal-output';
        root.appendChild(output);

        const inputRow = document.createElement('div');
        inputRow.id = 'fnyoat-terminal-input-row';
        inputRow.className = 'hidden';

        const promptSpan = document.createElement('span');
        promptSpan.id = 'fnyoat-terminal-prompt';
        promptSpan.textContent = _promptText;

        const inputContainer = document.createElement('span');
        inputContainer.id = 'fnyoat-terminal-input-container';

        const inputSpan = document.createElement('span');
        inputSpan.id = 'fnyoat-terminal-input';

        const inputAfterSpan = document.createElement('span');
        inputAfterSpan.id = 'fnyoat-terminal-input-after';

        const cursorSpan = document.createElement('span');
        cursorSpan.id = 'fnyoat-terminal-cursor';

        inputContainer.appendChild(inputSpan);
        inputContainer.appendChild(cursorSpan);
        inputContainer.appendChild(inputAfterSpan);

        inputRow.appendChild(promptSpan);
        inputRow.appendChild(inputContainer);
        root.appendChild(inputRow);

        const pasteInput = document.createElement('input');
        pasteInput.type = 'text';
        pasteInput.style.position = 'fixed';
        pasteInput.style.opacity = '0';
        pasteInput.style.pointerEvents = 'none';
        pasteInput.style.left = '-9999px';
        pasteInput.style.top = '-9999px';
        pasteInput.style.zIndex = '9999';
        pasteInput.setAttribute('aria-hidden', 'true');
        root.appendChild(pasteInput);

        document.body.appendChild(root);

        _root = root;
        _output = output;
        _inputRow = inputRow;
        _promptSpan = promptSpan;
        _inputSpan = inputSpan;
        _cursorSpan = cursorSpan;
        _inputAfterSpan = inputAfterSpan;
        _pasteInput = pasteInput;
    }

    function _destroyDom(): void {
        if (_root && _root.parentNode) _root.parentNode.removeChild(_root);
        _root = null;
        _output = null;
        _inputRow = null;
        _promptSpan = null;
        _inputSpan = null;
        _cursorSpan = null;
        _inputAfterSpan = null;
    }

    // ---------- 输出辅助 ----------

    function _appendLine(text: string, cls?: string): void {
        if (!_output) return;
        const line = document.createElement('div');
        line.className = 't-line' + (cls ? ' ' + cls : '');
        line.textContent = text;
        _output.appendChild(line);
        _smartScroll();
    }

    function _writeInline(text: string): void {
        if (!_output) return;
        const last = _output.lastElementChild as HTMLDivElement | null;
        if (last && last.classList.contains('t-line')) {
            last.textContent = (last.textContent || '') + text;
        } else {
            const line = document.createElement('div');
            line.className = 't-line';
            line.textContent = text;
            _output.appendChild(line);
        }
        _smartScroll();
    }

    let _scrollRafPending = false;
    function _smartScroll(): void {
        // _autoScroll = false 时禁用自动滚底（如长文本展示模式）
        if (!_autoScroll) return;
        // 滚动宿主是 html/body（系统原生滚动条），rAF 合并同帧多次滚动
        if (_scrollRafPending) return;
        _scrollRafPending = true;
        requestAnimationFrame(function (): void {
            _scrollRafPending = false;
            const h = Math.max(
                document.documentElement.scrollHeight || 0,
                document.body ? document.body.scrollHeight : 0
            );
            window.scrollTo(0, h);
        });
    }

    function _refreshInputRow(): void {
        if (!_inputRow || !_promptSpan || !_inputSpan || !_cursorSpan) return;
        _inputRow.classList.toggle('hidden', !_inputEnabled);
        _promptSpan.textContent = _promptText;
        const displayText = (typeof _inputIsPassword !== 'undefined' && _inputIsPassword)
            ? '*'.repeat(_inputBuffer.length)
            : _inputBuffer;
        const pos = Math.max(0, Math.min(_cursorPos, displayText.length));
        const before = displayText.substring(0, pos + 1);
        const after = displayText.substring(pos + 1);
        _inputSpan.textContent = before;
        if (_inputAfterSpan) {
            _inputAfterSpan.textContent = after;
        }
        if (_cursorSpan) {
            if (pos < displayText.length) {
                _cursorSpan.textContent = displayText.charAt(pos);
                _cursorSpan.style.marginLeft = '-1ch';
            } else {
                _cursorSpan.textContent = ' ';
                _cursorSpan.style.marginLeft = '0';
            }
        }
    }

    // ---------- 打开 / 关闭 ----------

    function open(): Promise<void> {
        if (_isOpen) return Promise.resolve();
        _isOpen = true;
        // 冻结 RPG Maker 事件解释器，禁止背景事件并行执行
        (window as any).__fnyoat_terminalFreeze();

        // —— 切换页面滚动环境：让 html/body 产生系统原生滚动条 ——
        const htmlEl = document.documentElement;
        const bodyEl = document.body;
        _savedHtmlStyle = htmlEl.getAttribute('style') || '';
        _savedBodyStyle = bodyEl.getAttribute('style') || '';
        htmlEl.style.margin = '0';
        htmlEl.style.padding = '0';
        htmlEl.style.height = 'auto';
        htmlEl.style.minHeight = '100%';
        htmlEl.style.overflowY = 'auto';
        htmlEl.style.overflowX = 'hidden';
        htmlEl.style.background = '#000';
        bodyEl.style.margin = '0';
        bodyEl.style.padding = '0';
        bodyEl.style.height = 'auto';
        bodyEl.style.minHeight = '100%';
        bodyEl.style.overflowY = 'auto';
        bodyEl.style.overflowX = 'hidden';
        bodyEl.style.background = '#000';
        // 隐藏 body 中除终端外的其他子元素（RPG Maker 的 canvas/场景层）
        _savedBodyChildrenHidden = [];
        for (let i = 0; i < bodyEl.children.length; i++) {
            const child = bodyEl.children[i] as HTMLElement;
            if (child.id === 'fnyoat-terminal-style') continue;
            _savedBodyChildrenHidden.push({ el: child, display: child.style.display });
            child.style.display = 'none';
        }

        _buildDom();
        _history = (typeof fnyoat !== 'undefined' && (fnyoat as any).store) ? ((fnyoat as any).store.get('shell_history') || []) : [];
        _historyIndex = _history.length;
        _interruptRequested = false;
        _interruptCallbacks = [];
        _isRunningProgram = false;
        _currentShellActive = false;
        _inputMode = 'idle';
        _inputEnabled = false;
        _inputBuffer = '';
        _cursorPos = 0;
        _inputIsPassword = false;
        _inputCallback = null;
        _refreshInputRow();
        _printWelcome();
        _bindKeyboard();
        _bindPaste();
        _startCursorTicker();
        // DOM 挂好后下一帧再滚一次 —— 确保布局稳定
        requestAnimationFrame(function (): void {
            window.scrollTo(0, document.documentElement.scrollHeight || document.body.scrollHeight);
        });

        // 返回 Promise，close() 时 resolve
        return new Promise<void>(function (resolve): void {
            _closeResolve = resolve;
        });
    }

    function close(): void {
        if (!_isOpen) return;
        _isOpen = false;
        _isRunningProgram = false;
        _currentShellActive = false;
        _interruptRequested = true;
        _runInterruptCallbacks();
        if (_menuState) {
            if (_menuState.timer) clearInterval(_menuState.timer);
            _menuState.resolve(-1);
            _menuState = null;
        }
        if (_loadRepeatTimer !== null) { clearInterval(_loadRepeatTimer); _loadRepeatTimer = null; _loadRepeatStop = false; _loadRepeatDir = 0; }
        _inputEnabled = false;
        _inputMode = 'idle';
        _externalKeyHandler = null;
        _waitAnyCallback = null;
        _waitAnyExclude = [];
        _inputCallback = null;
        _refreshInputRow();
        _destroyDom();
        _unbindPaste();
        _stopCursorTicker();
        // 还原 html/body 与其他 body 子元素的显示
        const htmlEl = document.documentElement;
        const bodyEl = document.body;
        if (_savedHtmlStyle === '') htmlEl.removeAttribute('style');
        else htmlEl.setAttribute('style', _savedHtmlStyle);
        if (_savedBodyStyle === '') bodyEl.removeAttribute('style');
        else bodyEl.setAttribute('style', _savedBodyStyle);
        for (let i = 0; i < _savedBodyChildrenHidden.length; i++) {
            const entry = _savedBodyChildrenHidden[i];
            entry.el.style.display = entry.display;
        }
        _savedBodyChildrenHidden = [];
        window.scrollTo(0, 0);
        // 解冻 RPG Maker 事件解释器，恢复背景事件执行
        (window as any).__fnyoat_terminalUnfreeze();
        // resolve open() 返回的 Promise
        if (_closeResolve) {
            _closeResolve();
            _closeResolve = null;
        }
        // 调用关闭回调
        if (_onCloseCallback) {
            _onCloseCallback();
        }
    }

    function isOpen(): boolean {
        return _isOpen;
    }

    function _printWelcome(): void {
        if (!_output) return;
        _appendLine('Type "help" for available commands, or Ctrl+C to interrupt.', 't-dim');
        _appendLine('');
    }

    // ---------- 输出 API ----------

    function printLine(text?: string): void {
        if (!_isOpen) return;
        _appendLine(text == null ? '' : String(text));
    }
    function write(text: string): void {
        if (!_isOpen) return;
        _writeInline(text);
    }
    function newLine(): void {
        if (!_isOpen) return;
        _appendLine('');
    }
    function clear(): void {
        if (!_isOpen || !_output) return;
        // textContent = '' 会走 DOM text-node 路径 —— 跳过 HTML 解析器
        _output.textContent = '';
        window.scrollTo(0, 0);
    }
    function undoLines(count: number): void {
        if (!_isOpen || !_output) return;
        const n = Math.max(0, count | 0);
        for (let i = 0; i < n; i++) {
            const last = _output.lastElementChild;
            if (last) _output.removeChild(last);
            else break;
        }
    }

    function info(text: string): void    { if (!_isOpen) return; _appendLine(text, 't-info'); }
    function success(text: string): void { if (!_isOpen) return; _appendLine(text, 't-success'); }
    function warn(text: string): void    { if (!_isOpen) return; _appendLine(text, 't-warn'); }
    function error(text: string): void   { if (!_isOpen) return; _appendLine(text, 't-error'); }

    // ---------- 中断 ----------

    function interrupt(): void {
        if (!_isOpen) return;
        _interruptRequested = true;
        _runInterruptCallbacks();
    }

    function _runInterruptCallbacks(): void {
        const list = _interruptCallbacks.slice();
        _interruptCallbacks = [];
        for (let i = 0; i < list.length; i++) {
            try { list[i](); } catch (e) { /* 忽略清理函数异常 */ }
        }
    }

    // ---------- 程序执行 ----------

    function _ctxSleep(ms: number): Promise<void> {
        return new Promise<void>(function (resolve, reject): void {
            const slice = Math.min(50, Math.max(1, ms | 0));
            const start = Date.now();
            const step = function (): void {
                if (_interruptRequested) {
                    _appendLine('^C', 't-error');
                    _runInterruptCallbacks();
                    const e: any = new Error('Interrupted');
                    e.__interrupted = true;
                    reject(e);
                    return;
                }
                if (Date.now() - start >= ms) {
                    resolve();
                } else {
                    setTimeout(step, slice);
                }
            };
            setTimeout(step, slice);
        });
    }

    function run(executor: (ctx: TerminalCtx) => void | Promise<void>): Promise<void> {
        return new Promise<void>(function (resolve): void {
            if (!_isOpen) { resolve(); return; }
            if (_isRunningProgram && !_isExecutingHistory) {
                console.warn('[Terminal] run(): 已有程序正在运行，忽略本次调用。');
                resolve();
                return;
            }
            if (!_isRunningProgram) {
                _isRunningProgram = true;
            }
            _interruptRequested = false;
            _interruptCallbacks = [];
            _inputMode = 'run';
            _inputEnabled = false;
            _refreshInputRow();

            const ctx: TerminalCtx = {
                println: function (text?: string): void { _appendLine(text == null ? '' : String(text)); },
                write: function (text: string): void { _writeInline(text); },
                newLine: function (): void { _appendLine(''); },
                clear: function (): void { clear(); },
                info: function (text: string): void { _appendLine(text, 't-info'); },
                success: function (text: string): void { _appendLine(text, 't-success'); },
                warn: function (text: string): void { _appendLine(text, 't-warn'); },
                error: function (text: string): void { _appendLine(text, 't-error'); },
                sleep: _ctxSleep,
                yield: function (): Promise<void> { return _ctxSleep(16); },
                isInterrupted: function (): boolean { return _interruptRequested; },
                onInterrupt: function (fn: () => void): void { _interruptCallbacks.push(fn); },
            };

            let maybePromise: void | Promise<void>;
            try {
                maybePromise = executor(ctx);
            } catch (err: any) {
                if (!(err && err.__interrupted)) {
                    const msg = err && err.message ? String(err.message) : String(err);
                    _appendLine('panic: ' + msg, 't-error');
                }
                _finalizeProgram();
                resolve();
                return;
            }

            if (maybePromise && typeof (maybePromise as any).then === 'function') {
                (maybePromise as Promise<void>).then(function (): void {
                    _finalizeProgram();
                    resolve();
                }).catch(function (err: any): void {
                    if (!(err && err.__interrupted)) {
                        const msg = err && err.message ? String(err.message) : String(err);
                        _appendLine('panic: ' + msg, 't-error');
                    }
                    _finalizeProgram();
                    resolve();
                });
            } else {
                _finalizeProgram();
                resolve();
            }
        });
    }

    function _finalizeProgram(): void {
        if (!_isExecutingHistory) {
            _isRunningProgram = false;
            _interruptRequested = false;
            _interruptCallbacks = [];
            if (_currentShellActive) {
                _enterShellPrompt();
            } else {
                _inputMode = 'idle';
                _inputEnabled = false;
                if (_root) _root.classList.remove('no-cursor');
                _refreshInputRow();
            }
        }
    }

    // ---------- Shell ----------

    function shell(): void {
        if (!_isOpen) open();
        _currentShellActive = true;
        _registerBuiltinCommands();
        _enterShellPrompt();
    }

    function setPrompt(prompt: string): void {
        _promptText = prompt || '$ ';
        if (_promptSpan) _promptSpan.textContent = _promptText;
    }

    function registerCommand(name: string, handler: TermCommandHandler): void {
        _commands[String(name).toLowerCase()] = handler;
    }

    function unregisterCommand(name: string): void {
        delete _commands[String(name).toLowerCase()];
    }

    function getHistory(): string[] {
        return _history.slice();
    }

    function _enterShellPrompt(): void {
        _inputMode = 'shell';
        _inputBuffer = '';
        _cursorPos = 0;
        _historyIndex = _history.length;
        _inputEnabled = true;
        const isLoginFlow = _loginState !== null;
        const isPasswordStep = isLoginFlow && _loginState!.attempts !== -1;
        const isUsernameStep = isLoginFlow && _loginState!.attempts === -1;
        const isSuFlow = _suState !== null;
        const isSudoFlow = _sudoState !== null;
        _inputIsPassword = isPasswordStep || isSuFlow || isSudoFlow;
        if (isPasswordStep) {
            _promptText = 'Password: ';
        } else if (isUsernameStep) {
            _promptText = 'login: ';
        } else if (isSuFlow) {
            _promptText = 'Password: ';
        } else if (isSudoFlow) {
            _promptText = '[sudo] password for root: ';
        } else {
            const dir = _formatPathForDisplay(_currentDir);
            const endChar = (_currentUser === 'root') ? '#' : '$';
            _promptText = _currentUser + '@shell:' + dir + endChar + ' ';
        }
        // 移除 no-cursor，让光标恢复闪烁（通过 .cursor-hidden class 控制）
        if (_root) _root.classList.remove('no-cursor');
        _inputCallback = function (line: string): void {
            const trimmed = line.replace(/\s+$/, '');
            const isAnyPasswordStep = isPasswordStep || isSuFlow || isSudoFlow;
            if (isAnyPasswordStep) {
                _appendLine(_promptText + '*'.repeat(trimmed.length));
            } else if (isUsernameStep) {
                _appendLine(_promptText + trimmed);
            } else {
                _appendLine(_promptText + trimmed);
                if (trimmed.length > 0 && !_isExecutingHistory && trimmed !== '!' && trimmed !== '!!') {
                    _history.push(trimmed);
                    if (typeof fnyoat !== 'undefined' && (fnyoat as any).store) {
                        (fnyoat as any).store.set('shell_history', _history);
                    }
                }
            }
            _historyIndex = _history.length;
            _executeShellLine(trimmed);
        };
        _refreshInputRow();
    }

    function _executeSudo(targetUser: string, command: string[]): void {
        if (command.length === 0) {
            _enterShellPrompt();
            return;
        }
        const originalUser = _currentUser;
        _currentUser = targetUser;
        const name = command[0].toLowerCase();
        const args = command.slice(1);
        const handler = _commands[name];
        if (!handler) {
            _appendLine(name + ': command not found', 't-error');
        } else {
            const ctx: TerminalCtx = {
                println: function (text?: string): void { _appendLine(text || ''); },
                write: function (text: string): void { _appendLine(text); },
                error: function (text: string): void { _appendLine(text, 't-error'); },
                success: function (text: string): void { _appendLine(text, 't-success'); },
                warn: function (text: string): void { _appendLine(text); },
                info: function (text: string): void { _appendLine(text); },
                newLine: function (): void { _appendLine(''); },
                sleep: function (ms: number): Promise<void> { return new Promise(function (resolve) { setTimeout(resolve, ms); }); },
                yield: function (): Promise<void> { return Promise.resolve(); },
                clear: function (): void { clear(); },
                isInterrupted: function (): boolean { return false; },
                onInterrupt: function (callback: () => void): void { },
            };
            try {
                handler(args, ctx);
            } catch (e) {
                _appendLine(name + ': ' + (e as Error).message, 't-error');
            }
        }
        _currentUser = originalUser;
        _enterShellPrompt();
    }

    function _executeShellLine(line: string): void {
        // -------- login 状态机处理 --------
        // 注意：提示符与回显由 _enterShellPrompt 统一管理，此处不再输出 "login:" / "Password:" 信息行
        if (_loginState !== null) {
            const accounts: { [user: string]: { password: string; label: string } } = {
                'bailianyo': { password: '1145141919810137891676767', label: 'bailianyo' },
            };
            // attempts = -1 时：正在等待输入用户名
            // attempts >= 0 时：正在等待输入密码（数值 = 剩余尝试次数）
            if (_loginState.attempts === -1) {
                // 等待输入用户名 —— 用户输入已由 _enterShellPrompt 的回显以 "login: xxx" 显示
                const username = line.trim().toLowerCase();
                if (!username) {
                    _appendLine('Login failed: no username entered.', 't-error');
                    _loginState = null;
                    _enterShellPrompt();
                    return;
                }
                // 已登录该账户 → 提示并退出登录流程
                if (username === _currentUser) {
                    _appendLine(username + ': you are already logged in as ' + username + '.', 't-error');
                    _loginState = null;
                    _enterShellPrompt();
                    return;
                }
                // root 永远拒绝，只给 0 次机会；bailianyo 等其他用户：可以尝试 3 次
                _loginState = { user: username, attempts: username === 'root' ? 0 : 3 };
                // 进入密码输入阶段：重新调用以切换到 "Password: " 提示符
                _enterShellPrompt();
                return;
            } else {
                const ls = _loginState;
                const password = line;

                const acc = accounts[ls.user];
                if (acc && password === acc.password) {
                    _authFailureCount = 0;
                    _currentUser = acc.label;
                    _loginState = null;
                    _appendLine('Welcome, ' + _currentUser + '.', 't-success');
                    _enterShellPrompt();
                } else {
                    if (ls.user === 'root') {
                        _appendLine('Permission denied.', 't-error');
                        _loginState = null;
                        _enterShellPrompt();
                    } else {
                        _authFailureCount++;
                        _appendLine('Login incorrect: wrong password for ' + ls.user + '.', 't-error');
                        if (_authFailureCount >= _MAX_AUTH_ATTEMPTS) {
                            _authLockedUntil = Date.now() + _AUTH_LOCK_DURATION;
                            _authFailureCount = 0;
                            const easterEggs = [
                                '猫在键盘上跑吗？把猫带走！',
                                '你的手在发抖吗？深呼吸再试一次。',
                                '是不是按错键盘了？仔细检查一下。'
                            ];
                            _appendLine(easterEggs[Math.floor(Math.random() * easterEggs.length)], 't-dim');
                            _appendLine('Too many failed attempts. Please try again later.', 't-error');
                            _loginState = null;
                            _enterShellPrompt();
                        } else {
                            _loginState = { user: ls.user, attempts: ls.attempts - 1 };
                            _enterShellPrompt();
                        }
                    }
                }
                return;
            }
        }

        if (_suState !== null) {
            const ss = _suState;
            const password = line;
            const accounts: { [user: string]: string } = {
                'root': _ROOT_PASSWORD,
                'bailianyo': '1145141919810137891676767'
            };
            if (accounts[ss.targetUser] && password === accounts[ss.targetUser]) {
                _authFailureCount = 0;
                _currentUser = ss.targetUser;
                _suState = null;
                _appendLine('');
                _enterShellPrompt();
            } else {
                _authFailureCount++;
                if (_authFailureCount >= _MAX_AUTH_ATTEMPTS) {
                    _authLockedUntil = Date.now() + _AUTH_LOCK_DURATION;
                    _authFailureCount = 0;
                    const easterEggs = [
                        '猫在键盘上跑吗？把猫带走！',
                        '你的手在发抖吗？深呼吸再试一次。',
                        '是不是按错键盘了？仔细检查一下。'
                    ];
                    _appendLine(easterEggs[Math.floor(Math.random() * easterEggs.length)], 't-dim');
                    _appendLine('su: Too many failed attempts. Please try again later.', 't-error');
                    _suState = null;
                    _enterShellPrompt();
                } else {
                    _appendLine('su: Authentication failure', 't-error');
                    _enterShellPrompt();
                }
            }
            return;
        }

        if (_sudoState !== null) {
            const ss = _sudoState;
            _sudoState = null;
            if (ss.targetUser === 'root' && line === _ROOT_PASSWORD) {
                _authFailureCount = 0;
                _sudoCache[ss.targetUser] = Date.now() + 15 * 60 * 1000;
                _executeSudo(ss.targetUser, ss.command);
            } else {
                _authFailureCount++;
                if (_authFailureCount >= _MAX_AUTH_ATTEMPTS) {
                    _authLockedUntil = Date.now() + _AUTH_LOCK_DURATION;
                    _authFailureCount = 0;
                    const easterEggs = [
                        '猫在键盘上跑吗？把猫带走！',
                        '你的手在发抖吗？深呼吸再试一次。',
                        '是不是按错键盘了？仔细检查一下。'
                    ];
                    _appendLine(easterEggs[Math.floor(Math.random() * easterEggs.length)], 't-dim');
                    _appendLine('sudo: Too many failed attempts. Please try again later.', 't-error');
                    _enterShellPrompt();
                } else {
                    _appendLine('sudo: password incorrect', 't-error');
                    _enterShellPrompt();
                }
            }
            return;
        }

        const raw = line.trim();
        if (!raw) {
            _enterShellPrompt();
            return;
        }
        const pipeParts = raw.split('|');
        if (pipeParts.length > 1) {
            run(async function (ctx: TerminalCtx): Promise<void> {
                await _executePipeline(pipeParts);
            });
            return;
        }
        const parts = _tokenizeCommand(raw);
        const name = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (name === 'exit' || name === 'quit' || name === 'logout') {
            // 在 shell 里输入 exit/quit/logout → 直接关闭终端
            _currentShellActive = false;
            _appendLine('');
            close();
            return;
        }

        const handler = _commands[name];
        if (!handler) {
            _appendLine(name + ': command not found', 't-error');
            _enterShellPrompt();
            return;
        }

        // jos 命令：特殊处理，不通过 run() 包装，避免嵌套 run 导致 _isRunningProgram 冲突
        // 设置 _currentShellActive = false 使后续 _finalizeProgram 不回到 shell prompt
        if (name === 'jos') {
            _currentShellActive = false;
            handler(args, {
                println: function (t?: string): void { _appendLine(t == null ? '' : String(t)); },
                write: function (t: string): void { _writeInline(t); },
                newLine: function (): void { _appendLine(''); },
                clear: function (): void { clear(); },
                info: function (t: string): void { _appendLine(t, 't-info'); },
                success: function (t: string): void { _appendLine(t, 't-success'); },
                warn: function (t: string): void { _appendLine(t, 't-warn'); },
                error: function (t: string): void { _appendLine(t, 't-error'); },
                sleep: _ctxSleep,
                yield: function (): Promise<void> { return _ctxSleep(16); },
                isInterrupted: function (): boolean { return false; },
                onInterrupt: function (): void { },
            });
            return;
        }

        run(async function (ctx: TerminalCtx): Promise<void> {
            const r = handler(args, ctx);
            if (r && typeof (r as any).then === 'function') {
                await r;
            }
        });
    }

    async function _executePipeline(pipeParts: string[]): Promise<void> {
        let inputLines: string[] = [];
        for (let i = 0; i < pipeParts.length; i++) {
            const cmdStr = pipeParts[i].trim();
            if (!cmdStr) continue;
            const parts = _tokenizeCommand(cmdStr);
            if (parts.length === 0) continue;
            const name = parts[0].toLowerCase();
            const args = parts.slice(1);
            const handler = _commands[name];
            if (!handler) {
                _appendLine(name + ': command not found', 't-error');
                return;
            }
            const outputLines: string[] = [];
            const ctx: TerminalCtx & { inputLines?: string[] } = {
                println: function (text?: string): void { outputLines.push(text == null ? '' : String(text)); },
                write: function (text: string): void { if (outputLines.length === 0) outputLines.push(''); outputLines[outputLines.length - 1] += text; },
                newLine: function (): void { outputLines.push(''); },
                clear: function (): void { outputLines.length = 0; },
                info: function (text: string): void { outputLines.push(text); },
                success: function (text: string): void { outputLines.push(text); },
                warn: function (text: string): void { outputLines.push(text); },
                error: function (text: string): void { _appendLine(text, 't-error'); },
                sleep: _ctxSleep,
                yield: function (): Promise<void> { return _ctxSleep(16); },
                isInterrupted: function (): boolean { return _interruptRequested; },
                onInterrupt: function (fn: () => void): void { _interruptCallbacks.push(fn); },
                inputLines: inputLines,
            };
            const r = handler(args, ctx);
            if (r && typeof (r as any).then === 'function') {
                await r;
            }
            if (i === pipeParts.length - 1) {
                for (const line of outputLines) {
                    _appendLine(line);
                }
            } else {
                inputLines = outputLines;
            }
        }
        _enterShellPrompt();
    }

    function _tokenizeCommand(line: string): string[] {
        const out: string[] = [];
        let i = 0;
        const n = line.length;
        while (i < n) {
            const ch = line.charCodeAt(i);
            if (ch === 0x20 || ch === 0x09) { i++; continue; }
            if (ch === 0x22) {
                i++;
                let buf = '';
                while (i < n && line.charCodeAt(i) !== 0x22) { buf += line.charAt(i); i++; }
                if (i < n) i++;
                out.push(buf);
                continue;
            }
            let buf = '';
            while (i < n) {
                const c = line.charCodeAt(i);
                if (c === 0x20 || c === 0x09) break;
                buf += line.charAt(i); i++;
            }
            out.push(buf);
        }
        return out;
    }

    function _registerBuiltinCommands(): void {
        if (_commands['help']) return;

        registerCommand('help', function (args: string[], ctx: TerminalCtx): void {
            ctx.println('Available commands:');
            ctx.println('  help                  Show this message');
            ctx.println('  clear / cls           Clear the screen');
            ctx.println('  echo <text>           Print text');
            ctx.println('  history               Show command history');
            ctx.println('  whoami / who          Print current user');
            ctx.println('  login [user]          Login as user (root: always denied)');
            ctx.println('  date                  Print current date');
            ctx.println('  time                  Print current time (HH:MM:SS)');
            ctx.println('  times                 Print process/system time summary');
            ctx.println('  jos                   Re-open JOS main menu');
            ctx.println('  sleep <ms>            Sleep N milliseconds (try Ctrl+C)');
            ctx.println('  yes [text]            Repeat text indefinitely (default: y)');
            ctx.println('  scan                  Demo: animated progress scan');
            ctx.println('  kill                  Kill current session (logout)');
            ctx.println('  last                  Show login history');
            ctx.println('  uptime                Show system uptime');
            ctx.println('  su [user]             Switch user (root denied)');
            ctx.println('  sudo [cmd]            Execute command as root (denied)');
            ctx.println('  exit / quit / logout   Close terminal');
            ctx.newLine();
            ctx.println('File management:');
            ctx.println('  pwd                   Print working directory');
            ctx.println('  cd [dir]              Change directory (non-admins cannot leave game dir)');
            ctx.println('  ls / dir / ll / la    List directory contents');
            ctx.println('  mkdir <dir>...        Create directories');
            ctx.println('  rmdir <dir>...        Remove empty directories');
            ctx.println('  touch <file>...       Change file timestamps');
            ctx.println('  rm [-rf] <file>...   Remove files or directories');
            ctx.println('  mv <src> <dst>         Move or rename files');
            ctx.println('  cp <src> <dst>         Copy files');
            ctx.println('  cat / less / more <f>   View file contents');
            ctx.println('  chmod / chown / chgrp  Change file mode/owner/group');
            ctx.println('  find / tree / stat     Search/list/inspect files');
            ctx.println('  ln                      Make links');
            ctx.newLine();
            ctx.info('Press Ctrl+C to interrupt a running command.');
        });

        registerCommand('clear', function (args: string[], ctx: TerminalCtx): void { ctx.clear(); });
        registerCommand('cls',   function (args: string[], ctx: TerminalCtx): void { ctx.clear(); });

        registerCommand('echo', function (args: string[], ctx: TerminalCtx): void {
            ctx.println(args.join(' '));
        });

        registerCommand('history', function (args: string[], ctx: TerminalCtx): void {
            if (_history.length === 0) { ctx.info('(no history)'); return; }
            for (let i = 0; i < _history.length; i++) {
                ctx.println(String(i + 1).padStart(4, ' ') + '  ' + _history[i]);
            }
        });

        registerCommand('!!', function (args: string[], ctx: TerminalCtx): void {
            if (_history.length === 0) { ctx.error('No previous command'); return; }
            const cmd = _history[_history.length - 1];
            ctx.println(_promptText + cmd);
            _isExecutingHistory = true;
            _executeShellLine(cmd);
            _isExecutingHistory = false;
        });

        registerCommand('!', function (args: string[], ctx: TerminalCtx): void {
            if (_history.length === 0) { ctx.error('No previous command'); return; }
            let cmd: string;
            if (args.length === 0) {
                cmd = _history[_history.length - 1];
            } else {
                const spec = args[0];
                let idx: number;
                if (spec === '-') {
                    idx = _history.length - 2;
                } else if (spec.startsWith('-')) {
                    const n = parseInt(spec.substring(1), 10);
                    if (isNaN(n) || n <= 0) { ctx.error('Invalid history reference'); return; }
                    idx = _history.length - n;
                } else {
                    idx = parseInt(spec, 10) - 1;
                    if (isNaN(idx)) {
                        for (let i = _history.length - 1; i >= 0; i--) {
                            if (_history[i].startsWith(spec)) {
                                idx = i;
                                break;
                            }
                        }
                        if (typeof idx !== 'number') { ctx.error('No matching command'); return; }
                    }
                }
                if (idx < 0 || idx >= _history.length) { ctx.error('No such command in history'); return; }
                cmd = _history[idx];
            }
            ctx.println(_promptText + cmd);
            _isExecutingHistory = true;
            _executeShellLine(cmd);
            _isExecutingHistory = false;
        });

        registerCommand('whoami', function (args: string[], ctx: TerminalCtx): void {
            ctx.println(_currentUser);
        });

        registerCommand('login', function (args: string[], ctx: TerminalCtx): void {
            // 检查是否已在登录流程中
            if (_loginState !== null) {
                ctx.error('login: already logging in.');
                return;
            }
            if (args[0]) {
                const username = args[0].toLowerCase();
                // 已登录该账户
                if (username === _currentUser) {
                    ctx.error(username + ': you are already logged in as ' + username + '.');
                    return;
                }
                // 进入密码输入阶段（不额外输出 Password:，由 _enterShellPrompt 统一管理提示符）
                _loginState = { user: username, attempts: username === 'root' ? 0 : 3 };
            } else {
                // 进入用户名输入阶段
                _loginState = { user: '', attempts: -1 };
            }
        });

        registerCommand('date', function (args: string[], ctx: TerminalCtx): void {
            ctx.println(new Date().toString());
        });

        registerCommand('grep', function (args: string[], ctx: TerminalCtx): void {
            if (args.length === 0) {
                ctx.error('usage: grep pattern [file...]');
                return;
            }
            const pattern = args[0];
            const lines = (ctx as any).inputLines || [];
            for (const line of lines) {
                if (line.indexOf(pattern) !== -1) {
                    ctx.println(line);
                }
            }
        });

        registerCommand('time', function (args: string[], ctx: TerminalCtx): void {
            const d = new Date();
            const pad = function (n: number): string { return n < 10 ? '0' + n : '' + n; };
            ctx.println(pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()));
        });

        registerCommand('times', function (args: string[], ctx: TerminalCtx): void {
            // 浏览器环境下没有真正的进程时间，用 performance.now() 近似
            // 模拟 bash times(1) 的 4 个字段：user / system / children-user / children-system
            const now = typeof performance !== 'undefined' ? (performance.now() / 1000) : (Date.now() / 1000);
            const fmt = function (s: number): string {
                const m = Math.floor(s / 60);
                const sec = (s - m * 60).toFixed(3);
                return m + 'm' + (parseFloat(sec) < 10 ? '0' : '') + sec + 's';
            };
            ctx.println('0m' + (now % 60).toFixed(3) + 's  0m0.000s');
            ctx.println('0m0.000s  0m0.000s');
        });

        registerCommand('jos', function (args: string[], ctx: TerminalCtx): void {
            // 由 CoreForJOS 注册：关闭终端并重新打开主菜单
            if (_josMenuHandler) {
                _josMenuHandler();
            } else {
                ctx.error('jos: no menu handler registered');
            }
        });

        registerCommand('sleep', async function (args: string[], ctx: TerminalCtx): Promise<void> {
            const ms = parseInt(args[0], 10);
            if (isNaN(ms) || ms <= 0) { ctx.error('sleep: expected positive milliseconds'); return; }
            ctx.println('sleeping ' + ms + 'ms ... (press Ctrl+C to interrupt)');
            await ctx.sleep(ms);
            ctx.success('done');
        });

        registerCommand('yes', async function (args: string[], ctx: TerminalCtx): Promise<void> {
            const text = args.length > 0 ? args.join(' ') : 'y';
            ctx.println('(press Ctrl+C to stop)');
            while (true) {
                ctx.println(text);
                await ctx.sleep(25);
            }
        });

        registerCommand('scan', async function (args: string[], ctx: TerminalCtx): Promise<void> {
            const total = 20;
            for (let i = 1; i <= total; i++) {
                const bar = '[' + _repeat('#', i) + _repeat('.', total - i) + ']';
                const pct = String(Math.floor(i * 100 / total)).padStart(3, ' ') + '%';
                ctx.println(bar + ' ' + pct + '  scanning sector ' + i);
                await ctx.sleep(100);
            }
            ctx.success('scan complete');
        });

        registerCommand('kill', function (args: string[], ctx: TerminalCtx): void {
            if (args.length === 0) {
                ctx.println('Usage: kill [-signal] <pid>');
                ctx.println('Send a signal to a process.');
                ctx.println('The most commonly used signals are:');
                ctx.println('  1       HUP (hang up)');
                ctx.println('  9       KILL (non-catchable, non-ignorable kill)');
                ctx.println('  15      TERM (software termination signal)');
                return;
            }
            const signalArg = args[0];
            const pidArg = args[1];
            if (signalArg === '-1' && pidArg === '$$') {
                ctx.println('Killed session for user "' + _currentUser + '"');
                close();
            } else {
                ctx.error('kill: cannot kill process ' + (pidArg || signalArg));
            }
        });

        registerCommand('last', function (args: string[], ctx: TerminalCtx): void {
            const now = Date.now();
            const formatTime = function (ms: number): string {
                const diff = now - ms;
                if (diff < 60000) return 'just now';
                if (diff < 3600000) return Math.floor(diff / 60000) + ' mins ago';
                if (diff < 86400000) return Math.floor(diff / 3600000) + ' hours ago';
                return new Date(ms).toLocaleDateString();
            };
            const thisYear = new Date().getFullYear();
            let june7 = new Date(thisYear, 5, 7).getTime();
            if (june7 > now) {
                june7 = new Date(thisYear - 1, 5, 7).getTime();
            }
            const ibmBiosDefault = new Date(1987, 0, 1).getTime();
            ctx.println('  USER        FROM              LOGIN@   IDLE   JCPU   PCPU WHAT');
            ctx.println('  ' + _currentUser + '     :0               ' + formatTime(now) + '    -      -      -     -');
            ctx.println('  bailianyo   :0               ' + formatTime(june7) + '    -      -      -     -');
            ctx.println('  root        :0               ' + formatTime(ibmBiosDefault) + '    -      -      -     -');
            ctx.newLine();
            ctx.println('wtmp begins ' + new Date(now - 86400000).toString());
        });

        registerCommand('uptime', function (args: string[], ctx: TerminalCtx): void {
            const now = Date.now();
            const diff = now - _bootTime;
            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            let uptimeStr = 'up ';
            if (days > 0) uptimeStr += days + ' days, ';
            uptimeStr += String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
            ctx.println(new Date().toLocaleTimeString() + '  ' + uptimeStr);
        });

        registerCommand('su', function (args: string[], ctx: TerminalCtx): void {
            if (_suState !== null) {
                ctx.error('su: already attempting to switch user');
                return;
            }
            const now = Date.now();
            if (_authLockedUntil > now) {
                const remaining = Math.ceil((_authLockedUntil - now) / 1000);
                ctx.error('su: account locked. Please try again in ' + remaining + ' seconds.');
                return;
            }
            const targetUser = args.length === 0 ? 'root' : args[0];
            if (targetUser === _currentUser) {
                ctx.println('Already logged in as ' + targetUser);
                return;
            }
            if (targetUser !== 'root' && targetUser !== 'bailianyo') {
                ctx.error('su: user ' + targetUser + ' does not exist');
                return;
            }
            _suState = { targetUser: targetUser, attempts: 3 };
            _enterShellPrompt();
        });

        registerCommand('sudo', function (args: string[], ctx: TerminalCtx): void {
            if (args.length === 0) {
                ctx.println('usage: sudo [-u user] command [args...]');
                return;
            }
            let targetUser = 'root';
            let cmdStartIndex = 0;
            if (args[0] === '-u') {
                if (args.length < 3) {
                    ctx.println('usage: sudo [-u user] command [args...]');
                    return;
                }
                targetUser = args[1];
                cmdStartIndex = 2;
            } else {
                targetUser = 'root';
                cmdStartIndex = 0;
            }
            if (targetUser !== 'root') {
                ctx.error('sudo: user ' + targetUser + ' is not allowed to run sudo');
                return;
            }
            const cmdName = args[cmdStartIndex];
            if (!cmdName || !_commands[cmdName.toLowerCase()]) {
                ctx.error(cmdName + ': command not found');
                return;
            }
            const now = Date.now();
            if (_authLockedUntil > now) {
                const remaining = Math.ceil((_authLockedUntil - now) / 1000);
                ctx.error('sudo: account locked. Please try again in ' + remaining + ' seconds.');
                return;
            }
            if (_sudoCache[targetUser] && _sudoCache[targetUser] > now) {
                _executeSudo(targetUser, args.slice(cmdStartIndex));
                return;
            }
            if (_sudoState !== null) {
                ctx.error('sudo: already waiting for password');
                return;
            }
            _sudoState = { targetUser: targetUser, command: args.slice(cmdStartIndex) };
            _enterShellPrompt();
        });

        // ========== 文件管理命令（虚拟文件系统，所有写操作一律 Permission denied）==========

        registerCommand('pwd', function (args: string[], ctx: TerminalCtx): void {
            // pwd 永远显示真实的绝对虚拟路径（不使用 ~ 缩写）
            ctx.println(_normalizeVirtualPath(_currentDir));
        });

        registerCommand('cd', function (args: string[], ctx: TerminalCtx): void {
            const target = args[0] ? args[0] : _virtualGameRoot;
            const abs = _resolveVirtualPath(target);

            // 非管理员：非游戏目录外的路径一律无权限（不透露具体原因）
            if (!_isAdminUser() && _isOutsideGameRoot(abs)) {
                ctx.error('cd: permission denied: ' + target);
                return;
            }
            // 检查目录是否真实存在于磁盘上
            if (!_vfsIsDir(abs)) {
                ctx.error('cd: no such file or directory: ' + target);
                return;
            }
            _currentDir = abs;
            // 重新进入 shell prompt 以刷新提示符中的目录显示
            _promptText = _currentUser + '@shell:' + _formatPathForDisplay(_currentDir) +
                ((_currentUser === 'root') ? '#' : '$') + ' ';
            if (_promptSpan) _promptSpan.textContent = _promptText;
        });

        registerCommand('ls', function (args: string[], ctx: TerminalCtx): void {
            const target = args[0] || '.';
            const abs = _resolveVirtualPath(target);
            // 游戏根目录外：一律 Permission denied（不区分存在与否，避免结构泄露）
            if (_isOutsideGameRoot(abs)) { _denyFsAccess(ctx, 'ls', target); return; }
            if (_vfsIsDir(abs)) {
                const list = _vfsListDir(abs).filter(function (n): boolean { return n.charAt(0) !== '.'; }).sort();
                ctx.println(list.join('  '));
            } else if (_vfsIsFile(abs)) {
                const lastSlash = abs.lastIndexOf('/');
                ctx.println(abs.substring(lastSlash + 1));
            } else {
                ctx.error('ls: cannot access \'' + target + '\': No such file or directory');
            }
        });
        registerCommand('dir', function (args: string[], ctx: TerminalCtx): void {
            const target = args[0] || '.';
            const abs = _resolveVirtualPath(target);
            if (_isOutsideGameRoot(abs)) { _denyFsAccess(ctx, 'dir', target); return; }
            if (_vfsIsDir(abs)) {
                const list = _vfsListDir(abs).sort();
                for (let i = 0; i < list.length; i++) ctx.println(list[i]);
            } else if (_vfsIsFile(abs)) {
                const lastSlash = abs.lastIndexOf('/');
                ctx.println(abs.substring(lastSlash + 1));
            } else {
                ctx.error('dir: cannot access \'' + target + '\': No such file or directory');
            }
        });
        registerCommand('ll', function (args: string[], ctx: TerminalCtx): void {
            const target = args[0] || '.';
            const abs = _resolveVirtualPath(target);
            if (_isOutsideGameRoot(abs)) { _denyFsAccess(ctx, 'ls', target); return; }
            if (_vfsIsDir(abs)) {
                const list = _vfsListDir(abs).sort();
                for (let i = 0; i < list.length; i++) ctx.println(list[i]);
            } else if (_vfsIsFile(abs)) {
                const lastSlash = abs.lastIndexOf('/');
                ctx.println(abs.substring(lastSlash + 1));
            } else {
                ctx.error('ls: cannot access \'' + target + '\': No such file or directory');
            }
        });
        registerCommand('la', function (args: string[], ctx: TerminalCtx): void {
            const target = args[0] || '.';
            const abs = _resolveVirtualPath(target);
            if (_isOutsideGameRoot(abs)) { _denyFsAccess(ctx, 'ls', target); return; }
            if (_vfsIsDir(abs)) {
                const list = _vfsListDir(abs).sort();
                for (let i = 0; i < list.length; i++) ctx.println(list[i]);
            } else if (_vfsIsFile(abs)) {
                const lastSlash = abs.lastIndexOf('/');
                ctx.println(abs.substring(lastSlash + 1));
            } else {
                ctx.error('ls: cannot access \'' + target + '\': No such file or directory');
            }
        });

        registerCommand('mkdir', function (args: string[], ctx: TerminalCtx): void {
            if (args.length === 0) { ctx.error('mkdir: missing operand'); return; }
            for (let i = 0; i < args.length; i++) {
                const a = args[i];
                if (a.charAt(0) === '-') continue;
                _denyFsAccess(ctx, 'mkdir', a);
            }
        });
        registerCommand('rmdir', function (args: string[], ctx: TerminalCtx): void {
            if (args.length === 0) { ctx.error('rmdir: missing operand'); return; }
            for (let i = 0; i < args.length; i++) {
                const a = args[i];
                if (a.charAt(0) === '-') continue;
                _denyFsAccess(ctx, 'rmdir', a);
            }
        });
        registerCommand('touch', function (args: string[], ctx: TerminalCtx): void {
            if (args.length === 0) { ctx.error('touch: missing file operand'); return; }
            for (let i = 0; i < args.length; i++) {
                const a = args[i];
                if (a.charAt(0) === '-') continue;
                _denyFsAccess(ctx, 'touch', a);
            }
        });
        registerCommand('rm', function (args: string[], ctx: TerminalCtx): void {
            if (args.length === 0) { ctx.error('rm: missing operand'); return; }
            for (let i = 0; i < args.length; i++) {
                const a = args[i];
                if (a.charAt(0) === '-') continue;  // 忽略选项（如 -r, -f）
                _denyFsAccess(ctx, 'rm', a);
            }
        });
        registerCommand('mv', function (args: string[], ctx: TerminalCtx): void {
            if (args.length < 2) { ctx.error('mv: missing file operand'); return; }
            for (let i = 0; i < args.length; i++) {
                const a = args[i];
                if (a.charAt(0) === '-') continue;
                _denyFsAccess(ctx, 'mv', a);
            }
        });
        registerCommand('cp', function (args: string[], ctx: TerminalCtx): void {
            if (args.length < 2) { ctx.error('cp: missing file operand'); return; }
            for (let i = 0; i < args.length; i++) {
                const a = args[i];
                if (a.charAt(0) === '-') continue;
                _denyFsAccess(ctx, 'cp', a);
            }
        });
        registerCommand('cat', function (args: string[], ctx: TerminalCtx): void {
            if (args.length === 0) { ctx.error('cat: missing file operand'); return; }
            const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
            for (let i = 0; i < args.length; i++) {
                const a = args[i];
                if (a.charAt(0) === '-') continue;
                const abs = _resolveVirtualPath(a);
                if (_isOutsideGameRoot(abs)) { _denyFsAccess(ctx, 'cat', a); continue; }
                if (_vfsIsFile(abs)) {
                    const size = _realGetSize(abs);
                    if (size > MAX_FILE_SIZE) {
                        ctx.error('cat: ' + a + ': file too large (max 3MB)');
                        continue;
                    }
                    const content = _vfsReadFile(abs);
                    if (content) {
                        const lines = content.split('\n');
                        const end = lines.length > 0 && lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
                        for (let j = 0; j < end; j++) ctx.println(lines[j]);
                    }
                } else if (_vfsIsDir(abs)) {
                    ctx.error('cat: ' + a + ': Is a directory');
                } else {
                    ctx.error('cat: ' + a + ': No such file or directory');
                }
            }
        });
        registerCommand('less', function (args: string[], ctx: TerminalCtx): void {
            if (args.length === 0) { ctx.error('less: missing file operand'); return; }
            const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
            for (let i = 0; i < args.length; i++) {
                const a = args[i];
                if (a.charAt(0) === '-') continue;
                const abs = _resolveVirtualPath(a);
                if (_isOutsideGameRoot(abs)) { _denyFsAccess(ctx, 'less', a); continue; }
                if (_vfsIsFile(abs)) {
                    const size = _realGetSize(abs);
                    if (size > MAX_FILE_SIZE) {
                        ctx.error('less: ' + a + ': file too large (max 3MB)');
                        continue;
                    }
                    const content = _vfsReadFile(abs);
                    if (content) {
                        const lines = content.split('\n');
                        const end = lines.length > 0 && lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
                        for (let j = 0; j < end; j++) ctx.println(lines[j]);
                    }
                } else if (_vfsIsDir(abs)) {
                    ctx.error('less: ' + a + ': Is a directory');
                } else {
                    ctx.error('less: ' + a + ': No such file or directory');
                }
            }
        });
        registerCommand('more', function (args: string[], ctx: TerminalCtx): void {
            if (args.length === 0) { ctx.error('more: missing file operand'); return; }
            const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
            for (let i = 0; i < args.length; i++) {
                const a = args[i];
                if (a.charAt(0) === '-') continue;
                const abs = _resolveVirtualPath(a);
                if (_isOutsideGameRoot(abs)) { _denyFsAccess(ctx, 'more', a); continue; }
                if (_vfsIsFile(abs)) {
                    const size = _realGetSize(abs);
                    if (size > MAX_FILE_SIZE) {
                        ctx.error('more: ' + a + ': file too large (max 3MB)');
                        continue;
                    }
                    const content = _vfsReadFile(abs);
                    if (content) {
                        const lines = content.split('\n');
                        const end = lines.length > 0 && lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
                        for (let j = 0; j < end; j++) ctx.println(lines[j]);
                    }
                } else if (_vfsIsDir(abs)) {
                    ctx.error('more: ' + a + ': Is a directory');
                } else {
                    ctx.error('more: ' + a + ': No such file or directory');
                }
            }
        });
        registerCommand('chmod', function (args: string[], ctx: TerminalCtx): void {
            if (args.length < 2) { ctx.error('chmod: missing operand'); return; }
            for (let i = 1; i < args.length; i++) {
                _denyFsAccess(ctx, 'chmod', args[i]);
            }
        });
        registerCommand('chown', function (args: string[], ctx: TerminalCtx): void {
            if (args.length < 2) { ctx.error('chown: missing operand'); return; }
            for (let i = 1; i < args.length; i++) {
                _denyFsAccess(ctx, 'chown', args[i]);
            }
        });
        registerCommand('chgrp', function (args: string[], ctx: TerminalCtx): void {
            if (args.length < 2) { ctx.error('chgrp: missing operand'); return; }
            for (let i = 1; i < args.length; i++) {
                _denyFsAccess(ctx, 'chgrp', args[i]);
            }
        });
        registerCommand('find', function (args: string[], ctx: TerminalCtx): void {
            const target = args[0] || '.';
            const abs = _resolveVirtualPath(target);
            if (_isOutsideGameRoot(abs)) { _denyFsAccess(ctx, 'find', target); return; }
            if (!_vfsExists(abs)) { ctx.error('find: \'' + target + '\': No such file or directory'); return; }
            if (_vfsIsFile(abs)) { ctx.println(abs); return; }
            // 以该目录为根做一次深度遍历
            const stack: string[] = [abs];
            while (stack.length > 0) {
                const dir = stack.pop() as string;
                ctx.println(dir);
                const entries = _vfsListDir(dir).sort();
                for (let i = entries.length - 1; i >= 0; i--) {
                    const childPath = _vfsJoinDir(dir, entries[i]);
                    if (_vfsIsDir(childPath)) stack.push(childPath);
                    else ctx.println(childPath);
                }
            }
        });
        registerCommand('tree', function (args: string[], ctx: TerminalCtx): void {
            const target = args[0] || '.';
            const abs = _resolveVirtualPath(target);
            if (_isOutsideGameRoot(abs)) { _denyFsAccess(ctx, 'tree', target); return; }
            if (!_vfsExists(abs)) { ctx.error('tree: \'' + target + '\': No such file or directory'); return; }
            if (_vfsIsFile(abs)) { ctx.println(abs.substring(abs.lastIndexOf('/') + 1)); return; }
            // 打印树状结构，用前缀表示层级
            const displayName = abs === _virtualGameRoot ? '~' : abs.substring(abs.lastIndexOf('/') + 1);
            ctx.println(displayName);
            function printTree(dir: string, prefix: string): void {
                const entries = _vfsListDir(dir).sort();
                for (let i = 0; i < entries.length; i++) {
                    const isLast = i === entries.length - 1;
                    const name = entries[i];
                    const childPath = _vfsJoinDir(dir, name);
                    const branch = isLast ? '└── ' : '├── ';
                    ctx.println(prefix + branch + name);
                    if (_vfsIsDir(childPath)) {
                        const nextPrefix = prefix + (isLast ? '    ' : '│   ');
                        printTree(childPath, nextPrefix);
                    }
                }
            }
            printTree(abs, '');
        });
        registerCommand('stat', function (args: string[], ctx: TerminalCtx): void {
            if (args.length === 0) { ctx.error('stat: missing operand'); return; }
            for (let i = 0; i < args.length; i++) {
                const a = args[i];
                if (a.charAt(0) === '-') continue;
                const abs = _resolveVirtualPath(a);
                if (_isOutsideGameRoot(abs)) { _denyFsAccess(ctx, 'stat', a); continue; }
                if (_vfsIsFile(abs)) {
                    ctx.println('  File: ' + a);
                    const content = _vfsReadFile(abs);
                    ctx.println('  Size: ' + (content !== null ? content.length : 0) + '\t\tFile type: regular file');
                    ctx.println('Access: (0644/-rw-r--r--)');
                } else if (_vfsIsDir(abs)) {
                    ctx.println('  File: ' + a);
                    ctx.println('  Size: ' + (_vfsListDir(abs).length) + ' entries\tFile type: directory');
                    ctx.println('Access: (0755/drwxr-xr-x)');
                } else {
                    ctx.error('stat: cannot stat \'' + a + '\': No such file or directory');
                }
            }
        });
        registerCommand('ln', function (args: string[], ctx: TerminalCtx): void {
            if (args.length < 2) { ctx.error('ln: missing file operand'); return; }
            for (let i = 0; i < args.length; i++) {
                const a = args[i];
                if (a.charAt(0) === '-') continue;
                _denyFsAccess(ctx, 'ln', a);
            }
        });
        registerCommand('echo 测试 >', function (args: string[], ctx: TerminalCtx): void {
            // 这里注册的是具体命令名，不会被实际触发；真正的重定向通过命令行解析不在此范围内
            ctx.info('(redirection not supported in this shell)');
        });
        registerCommand('who', function (args: string[], ctx: TerminalCtx): void {
            ctx.println(_currentUser + ' tty1  ' + new Date().toString());
        });
    }

    // 用原生 String.prototype.repeat —— 底层是预分配 buffer 的 memcpy，比循环拼接快数倍
    function _repeat(ch: string, n: number): string {
        if (n <= 0) return '';
        if (ch.length === 1) return ch.repeat(n);
        // 多字符兜底（虽然 scan 里只用 '#' / '.' 单字符）
        let s = '';
        for (let i = 0; i < n; i++) s += ch;
        return s;
    }

    // ============================================================
    //  虚拟文件系统工具函数 —— 纯内存模拟，绝不读写真实文件系统
    // ============================================================

    // 是否为管理员（root / bailianyo 视为管理员）
    function _isAdminUser(): boolean {
        return _currentUser === 'root' || _currentUser === 'bailianyo';
    }

    // 归一化路径：处理 . 和 .. 以及多余斜杠，返回以 / 开头的绝对路径
    // 不解析符号链接，不访问真实文件系统
    function _normalizeVirtualPath(path: string): string {
        if (!path || path === '') return '/';
        // 替换 \ 为 /（接受 Windows 风格输入）
        path = path.replace(/\\/g, '/');
        // 将 DOS 风格盘符（C:\ 或 C:/）转换为 /C/
        path = path.replace(/^([A-Za-z]):([\/\\]|$)/, function (_m, drive): string {
            return '/' + drive.toUpperCase() + '/';
        });

        // 处理尾部 / 保留信息：如果原路径以 / 结尾（且不是根），记录一下
        const hadTrailing = path.length > 1 && path.charAt(path.length - 1) === '/';

        const parts: string[] = [];
        const segs = path.split('/');
        for (let i = 0; i < segs.length; i++) {
            const seg = segs[i];
            if (seg === '' || seg === '.') continue;
            if (seg === '..') {
                if (parts.length > 0) parts.pop();
                continue;
            }
            parts.push(seg);
        }
        let result = '/' + parts.join('/');
        if (hadTrailing && result.length > 1) result += '/';
        return result;
    }

    // 解析 ~ 前缀，把相对路径/绝对路径合并成绝对虚拟路径
    function _resolveVirtualPath(input: string): string {
        if (!input || input === '') return _normalizeVirtualPath(_currentDir);
        // 展开 ~ 或 ~user
        let path = input;
        if (path === '~' || path.indexOf('~/') === 0) {
            path = _virtualGameRoot + path.substring(1);
        }
        // 相对路径：拼到当前目录下
        if (path.charAt(0) !== '/' && !/^[A-Za-z]:/.test(path)) {
            path = _currentDir + '/' + path;
        }
        return _normalizeVirtualPath(path);
    }

    // 把绝对虚拟路径格式化为显示用路径：在游戏根目录下时用 ~ 替换前缀
    function _formatPathForDisplay(absPath: string): string {
        const p = _normalizeVirtualPath(absPath);
        if (p === _virtualGameRoot) return '~';
        if (p.indexOf(_virtualGameRoot + '/') === 0) {
            return '~' + p.substring(_virtualGameRoot.length);
        }
        return p;
    }

    // 判断目标路径是否在"游戏目录外"（越过了 _virtualGameRoot）
    function _isOutsideGameRoot(absPath: string): boolean {
        const p = _normalizeVirtualPath(absPath);
        if (p === _virtualGameRoot) return false;
        if (!(p.startsWith(_virtualGameRoot + '/'))) return true;
        return false;
    }

    // 统一的无权限提示（供所有写操作调用）
    function _permissionDenied(ctx: TerminalCtx, op: string, target?: string): void {
        if (target) {
            ctx.error(op + ': cannot access \'' + target + '\': Permission denied');
        } else {
            ctx.error(op + ': Permission denied');
        }
    }

    // 对文件操作统一输出 Permission denied。
    // 不区分"文件不存在/在游戏目录外/在游戏目录内"，全部给出同样的错误信息，
    // 防止玩家通过错误消息差异来遥测目录结构。
    function _denyFsAccess(ctx: TerminalCtx, op: string, rawTarget: string): boolean {
        void _resolveVirtualPath; // 保留链接但此处不使用
        ctx.error(op + ': cannot access \'' + rawTarget + '\': Permission denied');
        return true;
    }

    // 旧版虚拟文件系统辅助函数已移除（见上方兼容层）
    // _vfsIsDir / _vfsIsFile / _vfsExists / _vfsListDir / _vfsReadFile / _vfsJoinDir
    // 已重新实现为基于真实磁盘操作的版本，位于状态区之后

    // ---------- 键盘事件 ----------

    let _kbdHandler: ((ev: KeyboardEvent) => void) | null = null;

    function _bindKeyboard(): void {
        if (_kbdHandler) return;
        _kbdHandler = function (ev: KeyboardEvent): void {
            if (!_isOpen) return;

            // keyup：只阻止冒泡；但 TUI 读取界面需要用 keyup 清除重复定时器
            if (ev.type !== 'keydown') {
                if (ev.type === 'keyup' && _inputMode === 'tui_load') {
                    if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
                        // 标记软停止：让 interval 自己检查并清除（避免 interval 刚好在 keyup 前触发一次）
                        _loadRepeatStop = true;
                    }
                }
                ev.stopPropagation();
                return;
            }

            // F5：不拦截，让浏览器/NW.js 处理 reload（reload 前不 stopPropagation，否则事件到不了 window 层）
            if (ev.key === 'F5') {
                return;
            }

            // F1-F4、F6-F12：不 preventDefault，但 stopPropagation 阻止冒泡到 RPG Maker
            if (ev.key.startsWith('F') && ev.key.length <= 3) {
                ev.stopPropagation();
                return;
            }

            // Home/End/PageUp/PageDown —— 保留浏览器滚动，不 preventDefault
            if (ev.key === 'Home' || ev.key === 'End' ||
                ev.key === 'PageUp' || ev.key === 'PageDown') {
                ev.stopPropagation();
                return;
            }

            // 其他按键：stopPropagation + preventDefault，阻止 RPG Maker 收到
            ev.stopPropagation();
            ev.preventDefault();

            // external 模式：完全交给外部 handler 处理；返回 true 表示已消费
            if (_inputMode === 'external' && _externalKeyHandler) {
                const handled = _externalKeyHandler(ev);
                if (handled) return;
            }

            // IME 合成中 —— 忽略，等合成结束后的实际字符
            if (ev.isComposing) return;

            // Ctrl+C —— 中断
            if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'c' || ev.key === 'C')) {
                ev.preventDefault();
                ev.stopPropagation();
                if (_isRunningProgram) {
                    _interruptRequested = true;
                } else if (_inputMode === 'menu' && _menuState) {
                    // 菜单模式：与 Esc 相同逻辑 —— 先导航到退出项，已在退出项才真正退出
                    const ms = _menuState;
                    // 找第一个退出项（isExit/exitMode）渲染行；没有则默认最后一项
                    let exitRenderIdx = -1;
                    for (let r = 0; r < ms.renderedIndices.length; r++) {
                        if (_isExitOption(ms.options[ms.renderedIndices[r]])) { exitRenderIdx = r; break; }
                    }
                    if (exitRenderIdx < 0) exitRenderIdx = ms.renderedIndices.length - 1;
                    if (ms.selected === exitRenderIdx) {
                        // 已选中退出项 → 真正退出菜单
                        if (ms.onExit) ms.onExit();
                        if (_output) {
                            const lines = _output.children;
                            const s = ms.startLine;
                            for (let i = s + ms.lineCount - 1; i >= s; i--) { if (i < lines.length) _output.removeChild(lines[i]); }
                        }
                        const resolve = ms.resolve;
                        const origExitIdx = ms.renderedIndices[exitRenderIdx];
                        _menuState = null;
                        _inputMode = 'idle';
                        _inputEnabled = false;
                        _refreshInputRow();
                        resolve(origExitIdx);
                    } else {
                        // 未选中退出项 → 导航过去，不退出
                        ms.selected = exitRenderIdx;
                        _renderMenu();
                    }
                } else {
                    if (_inputMode === 'shell') {
                        _suState = null;
                        _sudoState = null;
                        _appendLine(_promptText + _inputBuffer + '^C', 't-error');
                        _enterShellPrompt();
                    } else if (_inputMode === 'prompt') {
                        _appendLine('^C', 't-error');
                        const cb = _inputCallback;
                        _inputCallback = null;
                        _inputMode = 'idle';
                        _inputEnabled = false;
                        _refreshInputRow();
                        if (cb) cb('');
                    }
                }
                return;
            }

            // Ctrl+L —— 清屏
            if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'l' || ev.key === 'L')) {
                ev.preventDefault();
                clear();
                return;
            }

            // Ctrl+V / Win+V —— 粘贴
            if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'v' || ev.key === 'V')) {
                ev.preventDefault();
                ev.stopPropagation();
                if (!_inputEnabled) return;
                if (navigator.clipboard && navigator.clipboard.readText) {
                    navigator.clipboard.readText().then(function (text: string): void {
                        if (text) {
                            _handlePastedText(text);
                        }
                    }).catch(function (err: any): void {
                        _doFallbackPaste();
                    });
                } else {
                    _doFallbackPaste();
                }
                return;
            }

            // Ctrl+R —— 反向搜索命令历史
            if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'r' || ev.key === 'R')) {
                ev.preventDefault();
                if (_inputMode !== 'shell') return;
                _appendLine('(reverse-i-search)\\`: ', 't-dim');
                _inputMode = 'search';
                _inputBuffer = '';
                _cursorPos = 0;
                _inputEnabled = true;
                _promptText = '(reverse-i-search)\\`';
                _inputCallback = function (line: string): void {
                    const trimmed = line.replace(/\s+$/, '');
                    if (!trimmed) {
                        _appendLine('(no match)', 't-error');
                    } else {
                        for (let i = _history.length - 1; i >= 0; i--) {
                            if (_history[i].indexOf(trimmed) !== -1) {
                                _appendLine(_history[i]);
                                break;
                            }
                        }
                    }
                    _enterShellPrompt();
                };
                _refreshInputRow();
                return;
            }

            // ========== 菜单模式键盘处理（↑↓ 导航 + 数字键直达 + Enter 确认） ==========
            // 注意：放在 _inputEnabled 守卫之外！因为菜单模式下 _inputEnabled = false
            if (_inputMode === 'menu' && _menuState) {
                const ms = _menuState;
                const opts = ms.options;

                // ↑ 键：上一个可见项（locked 项已被过滤，跳过）
                if (ev.key === 'ArrowUp') {
                    ev.preventDefault();
                    ev.stopPropagation();
                    let idx = ms.selected - 1;
                    if (idx < 0) idx = ms.renderedIndices.length - 1;
                    ms.selected = idx;
                    _renderMenu();
                    return;
                }

                // ↓ 键：下一个可见项
                if (ev.key === 'ArrowDown') {
                    ev.preventDefault();
                    ev.stopPropagation();
                    let idx = ms.selected + 1;
                    if (idx >= ms.renderedIndices.length) idx = 0;
                    ms.selected = idx;
                    _renderMenu();
                    return;
                }

                // 数字键 1-9：选中对应渲染行（locked 项不在渲染列表里，无视数字键）
                const num = parseInt(ev.key, 10);
                if (num >= 1 && num <= 9 && (num - 1) < ms.renderedIndices.length) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    _menuSelect(num - 1);
                    return;
                }

                // Enter / 空格 / Z：确认当前高亮项（RPG Maker 的 ok 映射：Enter/Space/Z/Gamepad A）
                if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'z' || ev.key === 'Z') {
                    ev.preventDefault();
                    ev.stopPropagation();
                    _menuSelect(ms.selected);
                    return;
                }

                // Escape / X：若当前选中退出项则退出菜单；否则导航到退出项（不退出）
                if (ev.key === 'Escape' || ev.key === 'x' || ev.key === 'X') {
                    ev.preventDefault();
                    ev.stopPropagation();
                    // 找到第一个 isExit/exitMode 项的渲染行；若没有则默认最后一项为退出项
                    let exitRenderIdx = -1;
                    for (let r = 0; r < ms.renderedIndices.length; r++) {
                        if (_isExitOption(ms.options[ms.renderedIndices[r]])) {
                            exitRenderIdx = r;
                            break;
                        }
                    }
                    if (exitRenderIdx < 0) exitRenderIdx = ms.renderedIndices.length - 1;
                    if (ms.selected === exitRenderIdx) {
                        // 已选中退出项 → 执行退出
                        const exitOpt = ms.options[ms.renderedIndices[exitRenderIdx]];
                        if (ms.onExit) ms.onExit();
                        if (ms.timer) { clearInterval(ms.timer); ms.timer = 0; }
                        if (_output) {
                            const lines = _output.children;
                            const s = ms.startLine;
                            for (let i = s + ms.lineCount - 1; i >= s; i--) { if (i < lines.length) _output.removeChild(lines[i]); }
                        }
                        const resolve = ms.resolve;
                        const origExitIdx = ms.renderedIndices[exitRenderIdx];
                        _menuState = null;
                        _inputMode = 'idle';
                        _inputEnabled = false;
                        _refreshInputRow();
                        resolve(origExitIdx);
                    } else {
                        // 未选中退出项 → 导航过去，不退出
                        ms.selected = exitRenderIdx;
                        _renderMenu();
                    }
                    return;
                }

                // 菜单模式下其他按键不传递给输入行
                return;
            }

            // ========== wait_any 模式：等待任意按键，方向键用于滚动 ==========
            if (_inputMode === 'wait_any' && _waitAnyCallback) {
                if (_waitAnyExclude.indexOf(ev.key) >= 0) {
                    // 排除的键：不触发回调，让页面滚动。需要主动触发滚动，因为终端的滚动容器可能不响应默认行为
                    if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
                        const step = 40; // 一次滚动的像素
                        const current = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
                        const max = Math.max(
                            document.documentElement.scrollHeight || 0,
                            document.body ? document.body.scrollHeight : 0
                        ) - window.innerHeight;
                        let next = current;
                        if (ev.key === 'ArrowDown') next = Math.min(max, current + step);
                        else next = Math.max(0, current - step);
                        window.scrollTo(0, next);
                    }
                    ev.preventDefault();
                    return;
                }
                ev.preventDefault();
                const cb = _waitAnyCallback;
                _inputMode = 'idle';
                _waitAnyCallback = null;
                _waitAnyExclude = [];
                cb();
                return;
            }

            // ========== TUI 读取界面键盘处理 ==========
            if (_inputMode === 'tui_load' && _loadScreenState) {
                const ls = _loadScreenState;
                if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
                    ev.preventDefault();
                    ev.stopPropagation();
                    // 浏览器自动重复的 keydown 跳过，由 interval timer 处理连续移动
                    if (ev.repeat) return;
                    // 清理可能存在的连续滚动
                    if (_loadRepeatTimer !== null) {
                        clearInterval(_loadRepeatTimer);
                        _loadRepeatTimer = null;
                    }
                    _loadRepeatStop = false;
                    _loadRepeatKeyDownTime = Date.now(); // 记录按键时间
                    // 立即移动一次（页内移动，超出边界则翻页）
                    const isUp = (ev.key === 'ArrowUp');
                    const isDown = (ev.key === 'ArrowDown');
                    const page = ls.page;
                    const itemsPerPage = ls.itemsPerPage;
                    const startSlot = (page - 1) * itemsPerPage + 1;
                    const endSlot = Math.min(page * itemsPerPage, ls.maxSlots);
                    if (isUp) {
                        if (ls.selected > startSlot) {
                            ls.selected--;
                        } else if (page > 1) {
                            // 翻到上一页，并跳到该页最后一个
                            ls.page--;
                            ls.selected = Math.min((ls.page - 1) * itemsPerPage + itemsPerPage, ls.maxSlots);
                        } else {
                            // 已是第一页第一项，循环到最后
                            ls.selected = ls.maxSlots;
                            ls.page = ls.totalPages;
                        }
                    } else if (isDown) {
                        if (ls.selected < endSlot) {
                            ls.selected++;
                        } else if (page < ls.totalPages) {
                            // 翻到下一页，并跳到该页第一个
                            ls.page++;
                            ls.selected = (page) * itemsPerPage + 1;
                        } else {
                            // 已是最后一页最后一项，循环到第一个
                            ls.selected = 1;
                            ls.page = 1;
                        }
                    }
                    (ls as any).errorMessage = '';
                    _renderLoadScreen();
                    // 延迟启动连续滚动，避免短按时立即移动
                    const keyDownTime = _loadRepeatKeyDownTime;
                    setTimeout(function(): void {
                        // 检查按键时间是否匹配，防止旧 timer 触发
                        if (_loadRepeatKeyDownTime !== keyDownTime) return;
                        if (!_loadScreenState || !_isOpen) return;
                        const dir = isDown ? 1 : -1;
                        _loadRepeatDir = dir;
                        _loadRepeatTimer = setInterval(function (): void {
                            if (!_loadScreenState || !_isOpen) return;
                            if (_loadRepeatStop) {
                                clearInterval(_loadRepeatTimer);
                                _loadRepeatTimer = null;
                                _loadRepeatStop = false;
                                return;
                            }
                            const s = _loadScreenState.selected;
                            const p = _loadScreenState.page;
                            const ipp = _loadScreenState.itemsPerPage;
                            const tp = _loadScreenState.totalPages;
                            const ss = (p - 1) * ipp + 1;
                            const es = Math.min(p * ipp, _loadScreenState.maxSlots);
                            if (_loadRepeatDir > 0) {
                                // 向下：页内移动，超出边界翻页
                                if (s < es) {
                                    _loadScreenState.selected = s + 1;
                                } else if (p < tp) {
                                    _loadScreenState.page = p + 1;
                                    _loadScreenState.selected = p * ipp + 1;
                                } else {
                                    _loadScreenState.selected = 1;
                                    _loadScreenState.page = 1;
                                }
                            } else {
                                // 向上：页内移动，超出边界翻页
                                if (s > ss) {
                                    _loadScreenState.selected = s - 1;
                                } else if (p > 1) {
                                    _loadScreenState.page = p - 1;
                                    _loadScreenState.selected = Math.min((p - 2) * ipp + ipp, _loadScreenState.maxSlots);
                                } else {
                                    _loadScreenState.selected = _loadScreenState.maxSlots;
                                    _loadScreenState.page = tp;
                                }
                            }
                            (_loadScreenState as any).errorMessage = '';
                            _renderLoadScreen();
                        }, _LOAD_REPEAT_RATE_MS);
                    }, 200); // 200ms 延迟后再启动连续滚动
                    return;
                }
                if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'z' || ev.key === 'Z') {
                    ev.preventDefault();
                    ev.stopPropagation();
                    // 检查槽是否为空
                    const info = (DataManager as any).loadSavefileInfo(ls.selected);
                    if (!info) {
                        // 空槽，显示错误并重新渲染
                        (ls as any).errorMessage = 'This timeline is empty.';
                        _renderLoadScreen();
                        return;
                    }
                    _closeLoadScreen(ls.selected);
                    return;
                }
                if (ev.key === 'Escape' || ev.key === 'x' || ev.key === 'X') {
                    ev.preventDefault();
                    ev.stopPropagation();
                    _closeLoadScreen(-1);
                    return;
                }
                const num = parseInt(ev.key, 10);
                if (num >= 1 && num <= 9 && num <= ls.maxSlots) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (_loadRepeatTimer !== null) { clearInterval(_loadRepeatTimer); _loadRepeatTimer = null; _loadRepeatStop = false; }
                    ls.selected = num;
                    // 同步更新页码
                    ls.page = Math.ceil(num / ls.itemsPerPage);
                    _renderLoadScreen();
                    return;
                }
                return;
            }

            // Shell 模式下按 Esc —— 阻止冒泡，不让它传到 RPG Maker
            if (_inputMode === 'shell' && ev.key === 'Escape') {
                ev.preventDefault();
                ev.stopPropagation();
                return;
            }

            if (!_inputEnabled) {
                // 命令执行中输入被禁用 —— 阻止按键传到 RPG Maker（Ctrl+C 除外）
                if (ev.key !== 'Escape' && !(ev.ctrlKey && (ev.key === 'c' || ev.key === 'C'))) {
                    ev.preventDefault();
                    ev.stopPropagation();
                }
                return;
            }

            if (ev.key === 'Enter') {
                ev.preventDefault();
                const line = _inputBuffer;
                _inputBuffer = '';
                const cb = _inputCallback;
                if (_inputMode !== 'shell') {
                    _inputEnabled = false;
                    _inputMode = 'idle';
                    _inputCallback = null;
                }
                _refreshInputRow();
                if (cb) cb(line);
                return;
            }

            if (ev.key === 'Backspace') {
                ev.preventDefault();
                if (_cursorPos > 0) {
                    _inputBuffer = _inputBuffer.slice(0, _cursorPos - 1) + _inputBuffer.slice(_cursorPos);
                    _cursorPos--;
                    _refreshInputRow();
                }
                return;
            }

            if (ev.key === 'Delete') {
                ev.preventDefault();
                if (_cursorPos < _inputBuffer.length) {
                    _inputBuffer = _inputBuffer.slice(0, _cursorPos) + _inputBuffer.slice(_cursorPos + 1);
                    _refreshInputRow();
                }
                return;
            }

            if (ev.key === 'ArrowLeft') {
                ev.preventDefault();
                if (_cursorPos > 0) {
                    _cursorPos--;
                    _refreshInputRow();
                }
                return;
            }

            if (ev.key === 'ArrowRight') {
                ev.preventDefault();
                if (_cursorPos < _inputBuffer.length) {
                    _cursorPos++;
                    _refreshInputRow();
                }
                return;
            }

            if (ev.key === 'ArrowUp') {
                ev.preventDefault();
                if (_inputMode === 'shell' && _history.length > 0) {
                    if (_historyIndex > 0) {
                        _historyIndex--;
                        _inputBuffer = _history[_historyIndex] || '';
                        _cursorPos = _inputBuffer.length;
                        _refreshInputRow();
                    }
                }
                return;
            }

            if (ev.key === 'ArrowDown') {
                ev.preventDefault();
                if (_inputMode === 'shell' && _history.length > 0) {
                    if (_historyIndex < _history.length - 1) {
                        _historyIndex++;
                        _inputBuffer = _history[_historyIndex] || '';
                        _cursorPos = _inputBuffer.length;
                        _refreshInputRow();
                    } else {
                        _historyIndex = _history.length;
                        _inputBuffer = '';
                        _cursorPos = 0;
                        _refreshInputRow();
                    }
                }
                return;
            }

            if (ev.key === 'Home') {
                ev.preventDefault();
                if (_inputEnabled) {
                    _cursorPos = 0;
                    _refreshInputRow();
                }
                return;
            }

            if (ev.key === 'End') {
                ev.preventDefault();
                if (_inputEnabled) {
                    _cursorPos = _inputBuffer.length;
                    _refreshInputRow();
                }
                return;
            }

            // PageUp / PageDown —— 让输出区滚动接管
            if (ev.key === 'PageUp' || ev.key === 'PageDown') {
                return;
            }

            // 可打印字符
            if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey && ev.key !== 'Process') {
                ev.preventDefault();
                _inputBuffer = _inputBuffer.slice(0, _cursorPos) + ev.key + _inputBuffer.slice(_cursorPos);
                _cursorPos++;
                _refreshInputRow();
                return;
            }
        };
        document.addEventListener('keydown', _kbdHandler, true);
        // 同时拦截 keypress 和 keyup，确保 RPG Maker 完全收不到按键
        document.addEventListener('keypress', _kbdHandler, true);
        document.addEventListener('keyup', _kbdHandler, true);
    }

    // ---------- 粘贴事件处理 ----------

    let _pasteHandler: ((ev: ClipboardEvent) => void) | null = null;

    function _bindPaste(): void {
        if (_pasteHandler) return;
        _pasteHandler = function (ev: ClipboardEvent): void {
            if (!_isOpen || !_inputEnabled) {
                return;
            }
            ev.preventDefault();
            let text = '';
            if (ev.clipboardData) {
                text = ev.clipboardData.getData('text');
            } else if ((window as any).clipboardData) {
                text = (window as any).clipboardData.getData('text');
            }
            if (!text) {
                return;
            }
            _handlePastedText(text);
            if (_pasteInput) {
                _pasteInput.value = '';
            }
        };
        document.addEventListener('paste', _pasteHandler, true);
        if (_pasteInput) {
            _pasteInput.addEventListener('paste', _pasteHandler, true);
        }
    }

    function _doFallbackPaste(): void {
        if (!_pasteInput) return;
        _pasteInput.value = '';
        _pasteInput.focus();
        _pasteInput.select();
        try {
            if (document.execCommand('paste')) {
                const text = _pasteInput.value;
                if (text) {
                    _handlePastedText(text);
                }
                _pasteInput.value = '';
            }
        } catch (err) {
        }
    }

    function _handlePastedText(text: string): void {
        const lines = text.split(/\r\n|\r|\n/);
        if (lines.length === 1) {
            _inputBuffer = _inputBuffer.slice(0, _cursorPos) + text + _inputBuffer.slice(_cursorPos);
            _cursorPos += text.length;
            _refreshInputRow();
        } else {
            const currentBuffer = _inputBuffer;
            _inputBuffer = '';
            _cursorPos = 0;
            const commands: string[] = [];
            if (currentBuffer.trim()) {
                commands.push(currentBuffer);
            }
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.trim()) {
                    commands.push(line);
                }
            }
            _executeCommandQueue(commands);
            _refreshInputRow();
        }
    }

    function _executeCommandQueue(commands: string[]): void {
        if (commands.length === 0) {
            return;
        }
        const cmd = commands.shift()!;
        _executeShellLine(cmd);
        setTimeout(function (): void {
            if (_inputMode === 'shell') {
                _executeCommandQueue(commands);
            } else {
                setTimeout(function (): void {
                    _executeCommandQueue([cmd].concat(commands));
                }, 100);
            }
        }, 100);
    }

    function _unbindPaste(): void {
        if (_pasteHandler) {
            document.removeEventListener('paste', _pasteHandler, true);
            _pasteHandler = null;
        }
    }

    // ---------- 光标闪烁（主循环 tick） ----------

    function _startCursorTicker(): void {
        _stopCursorTicker();
        _cursorTickerId = setInterval(function (): void { _tick(100); }, 100);
    }

    function _stopCursorTicker(): void {
        if (_cursorTickerId) {
            clearInterval(_cursorTickerId);
            _cursorTickerId = 0;
        }
    }

    function _tick(deltaTimeMs: number): void {
        if (!_isOpen || !_root) return;
        _cursorTimer += deltaTimeMs;
        if (_cursorTimer >= _cursorBlinkRate) {
            _cursorTimer = 0;
            _cursorVisible = !_cursorVisible;
            _root.classList.toggle('cursor-hidden', !_cursorVisible);
        }
    }

    // ---------- 兼容旧 API（一次性 prompt） ----------

    function enableInput(callback?: (line: string) => void): void {
        if (!_isOpen) return;
        _inputMode = 'prompt';
        _inputBuffer = '';
        _inputIsPassword = false;
        _inputEnabled = true;
        _inputCallback = function (line: string): void {
            _appendLine(line);
            if (callback) callback(line);
        };
        _refreshInputRow();
    }

    function disableInput(): void {
        _inputEnabled = false;
        _inputCallback = null;
        if (_inputMode === 'prompt') _inputMode = 'idle';
        _refreshInputRow();
    }

    function waitForKey(callback: (key: string) => void): void {
        if (!_isOpen) return;
        _inputMode = 'prompt';
        _inputBuffer = '';
        _inputEnabled = true;
        _inputCallback = function (): void {
            if (callback) callback('enter');
        };
        _refreshInputRow();
    }

    // ---------- 菜单选择（↑↓ 选择 + 数字键直达 + Enter 确认） ----------

    function _isExitOption(opt: any): boolean {
        return !!(opt && (opt.isExit || opt.exitMode));
    }

    function _renderMenu(): void {
        if (!_isOpen || !_menuState || !_output) return;
        const ms = _menuState;
        const output = _output;
        // 清除之前渲染的选项行（从 startLine + titleLineCount 开始，保留标题行）
        const lines = output.children;
        const total = lines.length;
        const optionStart = ms.startLine + ms.titleLineCount;
        for (let i = ms.startLine + ms.lineCount - 1; i >= optionStart; i--) {
            if (i < total) output.removeChild(lines[i]);
        }
        // 重构渲染索引（跳过 locked 项）和渲染行
        ms.renderedIndices = [];
        const newLines: HTMLDivElement[] = [];
        for (let i = 0; i < ms.options.length; i++) {
            if (ms.options[i].locked) continue;          // 隐藏锁定项
            ms.renderedIndices.push(i);
        }
        for (let r = 0; r < ms.renderedIndices.length; r++) {
            const origIdx = ms.renderedIndices[r];
            const opt = ms.options[origIdx];
            const marker = (r === ms.selected) ? '>' : ' ';
            const hint = opt.hint ? '  ' + opt.hint : '';
            let cls = '';
            if (r === ms.selected) {
                // 选中项：isExit → 红色，其他 → 绿色（静态高亮，不闪烁）
                cls = _isExitOption(opt) ? 't-error' : 't-success';
            }
            const div = document.createElement('div');
            div.className = 't-line' + (cls ? ' ' + cls : '');
            div.textContent = marker + ' ' + (r + 1) + ') ' + opt.label + hint;
            output.appendChild(div);
            newLines.push(div);
        }
        ms.lineCount = ms.titleLineCount + newLines.length;
        _smartScroll();
    }

    function _menuSelect(index: number): void {
        const ms = _menuState;
        if (!ms) return;
        // index 是渲染行索引，转为原始 options 索引
        const origIdx = ms.renderedIndices[index];
        if (origIdx === undefined) return;
        const opt = ms.options[origIdx];
        if (opt.locked) {
            // 理论上 locked 项不会出现在渲染列表里，这里兜底
            return;
        }
        // 退出项被确认：先调用 onExit 回调，再清除菜单
        if (_isExitOption(opt) && ms.onExit) ms.onExit();
        // 清除菜单
        if (!_output) { _menuState = null; return; }
        const lines = _output.children;
        const start = ms.startLine;
        for (let i = start + ms.lineCount - 1; i >= start; i--) {
            if (i < lines.length) _output.removeChild(lines[i]);
        }
        if (ms.timer) { clearInterval(ms.timer); ms.timer = 0; }
        _menuState = null;
        _inputMode = 'idle';
        _inputEnabled = false;
        _inputCallback = null;
        _refreshInputRow();
        ms.resolve(origIdx);
    }

    function menu(options: TerminalMenuOption[], onExit?: () => void, title?: string, hint?: string, initialSelected?: number): Promise<number> {
        return new Promise<number>(function (resolve): void {
            if (!_isOpen || !options.length) { resolve(-1); return; }
            // 过滤掉 locked 项，如果没有可见项则退出
            const visibleIndices = [];
            for (let i = 0; i < options.length; i++) {
                if (!options[i].locked) visibleIndices.push(i);
            }
            if (!visibleIndices.length) { resolve(-1); return; }

            // 默认选中第一个非退出项（避免第一次按 Esc 就直接退出），除非显式指定了 initialSelected
            let defaultSelected = 0;
            if (initialSelected === undefined) {
                for (let r = 0; r < visibleIndices.length; r++) {
                    if (!_isExitOption(options[visibleIndices[r]])) {
                        defaultSelected = r;
                        break;
                    }
                }
            } else {
                defaultSelected = initialSelected;
            }

            // 先记录 startLine，再渲染标题行，确保标题行也在清理范围内
            const startLine = _output ? _output.children.length : 0;
            let titleLineCount = 0;
            if (title || hint) {
                _appendLine('');
                if (title) _appendLine(title, 't-info');
                if (hint) _appendLine(hint, 't-dim');
                _appendLine('');
                titleLineCount = _output ? _output.children.length - startLine : 0;
            } else {
                _appendLine('');
                titleLineCount = 1;
            }

            _menuState = {
                options: options,
                renderedIndices: visibleIndices,
                selected: defaultSelected,
                lineCount: titleLineCount,
                titleLineCount: titleLineCount,
                startLine: startLine,
                resolve: resolve,
                onExit: onExit || null,
                timer: 0,
                blinkOn: true,
            };

            _renderMenu();

            _inputMode = 'menu';
            _inputEnabled = false;
            _inputCallback = null;
            _refreshInputRow();
        });
    }

    // ---------- TUI 读取界面（↑↓ 导航 + Enter 确认 + Esc 取消） ----------
    // 渲染存档列表和详细信息（会清除并重建从 startLine 开始的行）
    function _renderLoadScreen(): void {
        if (!_isOpen || !_output || !_loadScreenState) return;
        const ls = _loadScreenState;
        const output = _output;
        const lines = output.children;
        const total = lines.length;
        // 删除从 startLine+4 到末尾的所有内容（保留标题区4行，只刷新槽列表等动态内容）
        for (let i = total - 1; i >= ls.startLine + 4; i--) {
            output.removeChild(lines[i]);
        }
        // 清理上一步留下的冗余循环（确保 startLine 到 startLine+3 之间没有残留）
        // （startLine 到 startLine+3 是标题区，不删除）
        _loadSelectedEl = null; // 重置，每轮渲染重新记录
        // 缓存 loadSavefileInfo
        const hasDataManager = (typeof DataManager !== 'undefined' && (DataManager as any).loadSavefileInfo);
        const loadInfo = hasDataManager
            ? function (slot: number): any { return (DataManager as any).loadSavefileInfo(slot); }
            : function (): null { return null; };
        // 计算当前页的槽范围
        const page = ls.page;
        const itemsPerPage = ls.itemsPerPage;
        const startSlot = (page - 1) * itemsPerPage + 1;
        const endSlot = Math.min(page * itemsPerPage, ls.maxSlots);
        // 缓存当前选中槽的 info（详情区会再次用到）
        const selectedInfo = loadInfo(ls.selected);
        // 渲染当前页的槽
        for (let i = startSlot; i <= endSlot; i++) {
            const marker = (i === ls.selected) ? '>' : ' ';
            const info = (i === ls.selected) ? selectedInfo : loadInfo(i);
            let label: string;
            if (info) {
                label = '[ ' + i + ' ]  ' + info.playtime;
            } else {
                label = '[ ' + i + ' ]  (空)';
            }
            const isSelected = (i === ls.selected);
            const div = document.createElement('div');
            div.className = 't-line' + (isSelected ? ' t-success' : '');
            div.textContent = marker + ' ' + label;
            output.appendChild(div);
            if (isSelected) _loadSelectedEl = div;
        }
        // 页码指示器
        const pageDiv = document.createElement('div');
        pageDiv.className = 't-line t-dim';
        pageDiv.textContent = '  ── ' + page + ' / ' + ls.totalPages + ' ──';
        output.appendChild(pageDiv);
        // 如果有错误信息，显示错误
        if ((ls as any).errorMessage) {
            const div = document.createElement('div');
            div.className = 't-line t-error';
            div.textContent = '  ' + (ls as any).errorMessage;
            output.appendChild(div);
        } else if (selectedInfo) {
            const timestamp = new Date(selectedInfo.timestamp);
            const dateStr = timestamp.toLocaleDateString() + ' ' + timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const details = [
                '  游戏时间: ' + selectedInfo.playtime,
                '  存档时间: ' + dateStr,
            ];
            if (selectedInfo.characters && selectedInfo.characters.length > 0) {
                const names = selectedInfo.characters.map(function (c: any): string { return c[0]; }).join(', ');
                details.push('  队伍: ' + names);
            }
            for (let d = 0; d < details.length; d++) {
                const div = document.createElement('div');
                div.className = 't-line t-info';
                div.textContent = details[d];
                output.appendChild(div);
            }
        } else {
            const div = document.createElement('div');
            div.className = 't-line t-dim';
            div.textContent = '  此档案为空';
            output.appendChild(div);
        }
        // 先 _smartScroll 把页面滚到底，再让选中项滚入视口（保证底部内容可见且提示信息在视口内）
        _smartScroll();
        if (_loadSelectedEl) {
            requestAnimationFrame(function (): void {
                (_loadSelectedEl as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            });
        }
    }

    function _closeLoadScreen(slotIndex: number): void {
        if (_loadRepeatTimer !== null) { clearInterval(_loadRepeatTimer); _loadRepeatTimer = null; _loadRepeatStop = false; _loadRepeatDir = 0; }
        if (!_output) { _loadScreenState = null; return; }
        const ls = _loadScreenState;
        if (!ls) return;
        const lines = _output.children;
        const total = lines.length;
        // 删除从 startLine 到末尾的所有内容（包括标题区4行）
        for (let i = total - 1; i >= ls.startLine; i--) {
            _output.removeChild(lines[i]);
        }
        _loadScreenState = null;
        _inputMode = 'idle';
        _inputEnabled = false;
        _inputCallback = null;
        _refreshInputRow();
        ls.resolve(slotIndex);  // slotIndex: 1-based 存档槽，-1 = 取消
    }

    function showLoadScreen(maxSlots: number): Promise<number> {
        return new Promise<number>(function (resolve): void {
            if (!_isOpen) { resolve(-1); return; }
            const startLine = _output ? _output.children.length : 0;
            _appendLine('');
            _appendLine('─── 载入时间线 ───', 't-info');
            _appendLine('  ↑↓ 选择   Enter 确认   Esc 返回', 't-dim');
            _appendLine('');
            _loadScreenState = {
                maxSlots: maxSlots,
                selected: 1,
                page: 1,
                itemsPerPage: 10,
                totalPages: Math.ceil(maxSlots / 10),
                startLine: startLine,
                resolve: resolve,
                errorMessage: '',
            };
            _renderLoadScreen();
            _inputMode = 'tui_load';
            _inputEnabled = false;
            _inputCallback = null;
            _refreshInputRow();
        });
    }

    function showOptions(options: string[], callback?: (index: number) => void): void {
        if (!_isOpen) return;
        _appendLine('');
        for (let i = 0; i < options.length; i++) {
            _appendLine('  ' + (i + 1) + ') ' + options[i]);
        }
        _appendLine('');
        _inputMode = 'prompt';
        _inputBuffer = '';
        _inputEnabled = true;
        const oldPrompt = _promptText;
        _promptText = 'select> ';
        _inputCallback = function (line: string): void {
            _promptText = oldPrompt;
            const n = parseInt(line.trim(), 10);
            if (!isNaN(n) && n >= 1 && n <= options.length) {
                if (callback) callback(n - 1);
            } else {
                _appendLine('? invalid selection', 't-error');
                if (callback) callback(-1);
            }
        };
        _refreshInputRow();
    }

    function undo(): void { undoLines(1); }

    // ---------- RPG Maker MV Scene 集成 ----------

    const TerminalScene: any = (function () {
        function Scene(this: any): void { /* 空构造 */ }
        Scene.prototype = Object.create(Scene_Base.prototype);
        Scene.prototype.constructor = Scene;
        Scene.prototype.initialize = function (): void {
            Scene_Base.prototype.initialize.call(this);
            this._lastTs = 0;
        };
        Scene.prototype.create = function (): void {
            Scene_Base.prototype.create.call(this);
            open();
            shell();
            _stopCursorTicker(); // Scene.update 每帧调 _tick，不需要 setInterval 双驱动
        };
        Scene.prototype.update = function (): void {
            Scene_Base.prototype.update.call(this);
            const now = Date.now();
            const dt = this._lastTs ? (now - this._lastTs) : 16;
            this._lastTs = now;
            _tick(dt);
        };
        Scene.prototype.terminate = function (): void {
            close();
            Scene_Base.prototype.terminate.call(this);
        };
        return Scene;
    })();

    // ---------- 插件命令 ----------

    const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command: string, args: string[]): void {
        if (command === 'SimTerminal' || command === 'fnyoatTerminal') {
            const sub = (args[0] || '').toLowerCase();
            switch (sub) {
                case 'open':
                    open();
                    shell();
                    break;
                case 'close':
                    close();
                    break;
                case 'echo':
                    if (!_isOpen) open();
                    printLine(args.slice(1).join(' '));
                    break;
                case 'clear':
                    if (!_isOpen) open();
                    clear();
                    break;
            }
        } else if (_Game_Interpreter_pluginCommand) {
            _Game_Interpreter_pluginCommand.call(this, command, args);
        }
    };

    // ---------- 对外挂载 ----------

    fnyoat.Terminal = {
        open: open,
        close: close,
        isOpen: isOpen,
        print: printLine,
        println: printLine,
        write: write,
        newLine: newLine,
        clear: clear,
        undoLines: undoLines,
        undo: undo,
        info: info,
        success: success,
        warn: warn,
        error: error,
        run: run,
        interrupt: interrupt,
        shell: shell,
        setPrompt: setPrompt,
        registerCommand: registerCommand,
        unregisterCommand: unregisterCommand,
        history: getHistory,
        enableInput: enableInput,
        disableInput: disableInput,
        waitForKey: waitForKey,
        showOptions: showOptions,
        showLoadScreen: showLoadScreen,
        menu: menu,
        setJosMenuHandler: function (handler: () => void): void { _josMenuHandler = handler; },
        setOnCloseCallback: function (callback: () => void): void { _onCloseCallback = callback; },
        setWaitAnyKey: function (callback: () => void, excludeKeys?: string[]): void {
            _inputMode = 'wait_any';
            _waitAnyCallback = callback;
            _waitAnyExclude = excludeKeys || [];
        },
        setAutoScroll: function (enabled: boolean): void { _autoScroll = enabled; },
        setKeyHandler: function (handler: (ev: KeyboardEvent) => boolean): void {
            _inputMode = 'external';
            _externalKeyHandler = handler;
        },
        clearKeyHandler: function (): void {
            _inputMode = 'idle';
            _externalKeyHandler = null;
        },
        Terminal_Scene: TerminalScene,
        _tick: _tick,
    };

})();
