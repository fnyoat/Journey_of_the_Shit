//=============================================================================
// fnyoat_ErrorReporter.ts
// 仅保留错误日志功能，不拦截错误，不显示错误面板
// 日志文件保留三次游戏运行的报错记录，超出自动删除旧记录
// 检测游戏崩溃并在日志中特别说明
//=============================================================================

/*:
 * @plugindesc [错误日志] 游戏内错误日志系统 - 仅记录到文件，不拦截不显示
 * @author fnyoat
 *
 * @param Max Errors Per Run
 * @text 每次运行最大错误数
 * @type number
 * @default 30
 * @desc 每次游戏运行最多记录的错误数量
 *
 * @param Keep Runs
 * @text 保留运行次数
 * @type number
 * @default 3
 * @desc 日志文件保留几次游戏运行的记录，超出自动删除旧记录
 *
 * @param Log File Name
 * @text 日志文件名
 * @type string
 * @default error_report.log
 * @desc 错误日志保存的文件名
 *
 * @help
 * ============================================================================
 * 错误日志系统说明
 * ============================================================================
 *
 * 功能：
 *   1. 捕获 window.onerror（脚本错误）但不阻止传播
 *   2. 捕获 window 的 unhandledrejection 但不阻止传播
 *   3. 监听 SceneManager.onError（RM 场景切换错误）但不阻止原处理
 *   4. 监听 Graphics.printError（RM 图形错误）但不阻止原处理
 *   5. 监听 DataManager.loadData（RM 数据加载错误）但不阻止原处理
 *   6. 写入游戏根目录下 error_report.log
 *   7. 日志只保留三次游戏运行的报错记录，超出自动清理
 *   8. 检测游戏崩溃并在日志中特别标记 [CRASH]
 *   9. 检测游戏卡顿（3-10秒）并记录 [INFO] Game Stuttering
 *   10. 检测游戏卡死（超过10秒）并记录 [CRASH]
 *
 * API：
 *   fnyoat.ErrorReporter.report(title, message, stack) - 手动上报错误
 *   fnyoat.ErrorReporter.getAll() - 获取所有错误记录
 *   fnyoat.ErrorReporter.clear() - 清空错误记录
 */

declare var Imported: any;
declare var PluginManager: any;
declare var SceneManager: any;
declare var DataManager: any;
declare var Graphics: any;

Imported = Imported || {};
if (Imported.fnyoat_ErrorReporter) {}
Imported.fnyoat_ErrorReporter = true;

(window as any).fnyoat = (window as any).fnyoat || {};
const fnyoat_g: any = (window as any).fnyoat;

const ER_MAX: number = 30;
const ER_RUNS: number = 3;
const ER_FILENAME: string = 'error_report.log';

const ST: any = {
    errors: [],
    initialized: false,
    runId: 0,
    hooked: false,
    crashDetected: false,
};

fnyoat_g.ErrorReporter = {
    report: function (t: string, m: string, s?: string, k?: string): void {
        _rep(t, m, s, k);
    },
    getAll: function (): any[] { return ST.errors.slice(); },
    getLatest: function (): any { return ST.errors.length ? ST.errors[ST.errors.length - 1] : null; },
    clear: function (): void { ST.errors = []; },
};

function _rep(title: string, message: string, stack?: string, kind?: string): void {
    try {
        const e: any = {
            time: _ft(new Date()),
            runId: ST.runId,
            title: title || 'Error',
            message: message || '',
            stack: stack || _mkStack() || '',
            kind: kind || 'manual',
        };
        ST.errors.push(e);
        while (ST.errors.length > ER_MAX) ST.errors.shift();
        try { _file(e); } catch (e2) {}
    } catch (outer) {}
}

function _init(): void {
    if (ST.initialized) return;
    ST.initialized = true;

    ST.runId = Date.now();

    try {
        _file({
            time: _ft(new Date()),
            runId: ST.runId,
            title: '[Boot] ErrorReporter Active',
            message: 'fnyoat_ErrorReporter 已启动，RunID=' + ST.runId,
            stack: '',
            kind: 'system',
        });
    } catch (e) {}

    _purgeOldRuns();

    _hookRM();

    const win: any = window;
    if (win) {
        const old: any = win.onerror;
        win.onerror = function (msg: any, url: any, line: any, col: any, err: any): boolean {
            try {
                const m: string = String(msg) + '  @ ' + (url || '?') + ':' + (line != null ? line : '?') + ':' + (col != null ? col : '?');
                const s: string = (err && err.stack) ? String(err.stack) : m;
                _rep('[window] Script Error', m, s, 'window');
            } catch (e) {}
            if (old) {
                try {
                    const r: any = old.apply(win, arguments);
                    if (r === true) return true;
                } catch (e2) {}
            }
            return false;
        };
    }

    if (win && win.addEventListener) {
        win.addEventListener('error', function (ev: any): void {
            try {
                const err: any = ev.error;
                const m: string = err ? String(err.message) + '  @ ' + (err.fileName || '?') + ':' + (err.lineNumber != null ? err.lineNumber : '?') + ':' + (err.columnNumber != null ? err.columnNumber : '?') : String(ev.message || ev);
                const s: string = (err && err.stack) ? String(err.stack) : m;
                _rep('[window] Error Event', m, s, 'window');
            } catch (e) {}
        });

        win.addEventListener('unhandledrejection', function (ev: any): void {
            try {
                const reason: any = ev.reason;
                const m: string = (reason && reason.message) ? String(reason.message) : String(reason);
                const s: string = (reason && reason.stack) ? String(reason.stack) : m;
                _rep('[window] Promise Rejection', m, s, 'promise');
            } catch (e) {}
        });
    }

    _watchCrash();
}

function _hookRM(): void {
    try {
        const SM: any = (window as any).SceneManager;
        const G: any = (window as any).Graphics;
        const DM: any = (window as any).DataManager;

        if (SM && SM.onError && !SM._er_hooked) {
            const orig: any = SM.onError;
            SM.onError = function (err: any): void {
                try {
                    const m: string = (err && err.message) ? String(err.message) : String(err);
                    const s: string = (err && err.stack) ? String(err.stack) : m;
                    _rep('[RMMV] SceneManager.onError', m, s, 'rmmv');
                } catch (e) {}
                try { orig && orig.call(this, err); } catch (e2) {}
            };
            SM._er_hooked = true;
        }

        if (G && G.printError && !G._er_hooked) {
            const orig: any = G.printError;
            G.printError = function (name: any, msg: any): void {
                try { _rep('[RMMV] Graphics.printError: ' + String(name), String(msg), '', 'rmmv'); } catch (e) {}
                try { orig && orig.call(this, name, msg); } catch (e2) {}
            };
            G._er_hooked = true;
        }

        if (SM && SM.updateMain && !SM._er_hooked_upd) {
            const orig: any = SM.updateMain;
            SM.updateMain = function (): void {
                try { orig.call(this); } catch (err: any) {
                    try {
                        const m: string = (err && err.message) ? String(err.message) : String(err);
                        const s: string = (err && err.stack) ? String(err.stack) : m;
                        _rep('[RMMV] Scene.updateMain Error', m, s, 'rmmv');
                    } catch (e2) {}
                    throw err;
                }
            };
            SM._er_hooked_upd = true;
        }

        if (DM && DM.loadData && !DM._er_hooked_ld) {
            const orig: any = DM.loadData;
            DM.loadData = function (cls: any, src: any): void {
                try {
                    orig.call(this, cls, src);
                } catch (err: any) {
                    try {
                        const m: string = (err && err.message) ? String(err.message) : String(err);
                        const s: string = (err && err.stack) ? String(err.stack) : m;
                        _rep('[RMMV] DataManager.loadData', m + ' (src=' + String(src) + ')', s, 'rmmv');
                    } catch (e2) {}
                    throw err;
                }
            };
            DM._er_hooked_ld = true;
        }

        ST.hooked = true;
    } catch (e) {
        if (!ST.hooked) setTimeout(function (): void { _hookRM(); }, 1000);
    }
}

function _watchCrash(): void {
    const win: any = window;
    ST.hasShutdownLog = false;

    if (win && win.addEventListener) {
        win.addEventListener('beforeunload', function (): void {
            ST.hasShutdownLog = true;
            if (!ST.crashDetected) {
                try {
                    _file({
                        time: _ft(new Date()),
                        runId: ST.runId,
                        title: '[Shutdown] Normal Exit',
                        message: '游戏正常退出，RunID=' + ST.runId,
                        stack: '',
                        kind: 'system',
                    });
                } catch (e) {}
            }
        });

        win.addEventListener('unload', function (): void {
            if (!ST.hasShutdownLog && !ST.crashDetected) {
                try {
                    _file({
                        time: _ft(new Date()),
                        runId: ST.runId,
                        title: '[CRASH] Abnormal Exit',
                        message: '游戏异常退出（直接关闭），RunID=' + ST.runId,
                        stack: '',
                        kind: 'crash',
                    });
                } catch (e) {}
            }
        });
    }

    let lastFrameTime = Date.now();
    let stutterReported = false;

    const checkInterval = setInterval(function (): void {
        const now = Date.now();
        const diff = now - lastFrameTime;

        if (diff > 10000) {
            ST.crashDetected = true;
            clearInterval(checkInterval);
            try {
                _file({
                    time: _ft(new Date()),
                    runId: ST.runId,
                    title: '[CRASH] Game Frozen',
                    message: '游戏崩溃（冻结超过10秒无帧更新），RunID=' + ST.runId,
                    stack: '',
                    kind: 'crash',
                });
            } catch (e) {}
        } else if (diff > 3000 && !stutterReported) {
            stutterReported = true;
            try {
                _file({
                    time: _ft(new Date()),
                    runId: ST.runId,
                    title: '[INFO] Game Stuttering',
                    message: '游戏卡顿（冻结' + (diff / 1000).toFixed(1) + '秒），RunID=' + ST.runId,
                    stack: '',
                    kind: 'info',
                });
            } catch (e) {}
        } else if (diff <= 3000) {
            stutterReported = false;
        }

        lastFrameTime = now;
    }, 1000);

    const SM: any = (window as any).SceneManager;
    if (SM && SM.update) {
        const origUpdate: any = SM.update;
        SM.update = function (): void {
            lastFrameTime = Date.now();
            try { origUpdate.call(this); } catch (e) { throw e; }
        };
    }
}

function _purgeOldRuns(): void {
    try {
        const win: any = window;
        if (!win || !win.require) return;
        const fs: any = win.require('fs');
        const pathMod: any = win.require('path');

        let dir: string = '.';
        try {
            const proc: any = (window as any).process;
            if (proc && proc.cwd) dir = proc.cwd();
        } catch (e) {}

        const fn: string = ER_FILENAME;
        const fp: string = pathMod && pathMod.join ? pathMod.join(dir, fn) : (dir.replace(/\\$/, '') + '/' + fn);

        if (!fs.existsSync(fp)) return;

        const content: string = fs.readFileSync(fp, 'utf8');
        const lines: string[] = content.split('\n');

        let runStarts: number[] = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('[Boot] ErrorReporter Active')) {
                runStarts.push(i);
            }
        }

        if (runStarts.length <= ER_RUNS) return;

        const cutoffIndex: number = runStarts[runStarts.length - ER_RUNS];
        const newContent: string = lines.slice(cutoffIndex).join('\n');
        fs.writeFileSync(fp, newContent, 'utf8');
    } catch (e) {}
}

function _ft(d: Date): string {
    const p = (n: number): string => (n < 10 ? '0' + n : '' + n);
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
        ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}

function _fd(d: Date): string {
    const p = (n: number): string => (n < 10 ? '0' + n : '' + n);
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
}

function _mkStack(): string {
    try { return new Error().stack || ''; } catch (e) { return ''; }
}

function _file(entry: any): void {
    try {
        let fs: any = null;
        let pathMod: any = null;
        try {
            const win: any = window;
            if (win && win.require) {
                fs = win.require('fs');
                pathMod = win.require('path');
            }
        } catch (e) {}
        if (!fs) return;

        let dir: string = '.';
        try {
            const proc: any = (window as any).process;
            if (proc && proc.cwd) dir = proc.cwd();
        } catch (e) {}
        try {
            const href: string = (window as any).location && (window as any).location.href || '';
            const idx: number = href.indexOf('index.html');
            if (idx >= 0 && href.indexOf('file:///') >= 0) {
                dir = decodeURIComponent(href.substring(8, idx));
            }
        } catch (e) {}

        const fn: string = ER_FILENAME;
        const fp: string = pathMod && pathMod.join
            ? pathMod.join(dir, fn)
            : (dir.replace(/\\$/, '') + '/' + fn);

        _purgeOldRuns();

        const line: string =
            '========== [' + entry.time + '] [' + entry.kind + '] ' + entry.title + ' (RunID=' + entry.runId + ') ==========\n' +
            entry.message + '\n' +
            (entry.stack ? entry.stack + '\n' : '') + '\n';

        if (fs.appendFileSync) fs.appendFileSync(fp, line, 'utf8');
        else if (fs.appendFile) fs.appendFile(fp, line, 'utf8', function (): void {});
    } catch (e) {}
}

try { _init(); } catch (e) {}

fnyoat_g.ErrorReporter.test = function (): void {
    _rep('[TEST] 测试错误', '这是一条测试错误，验证日志功能是否正常', 'Error: test error\n    at Object.<anonymous>', 'manual');
};