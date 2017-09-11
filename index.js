var spawn = require('child_process').spawn;

var FLAGS = [
    'debug',
    '--debug',
    '--debug-brk',
    '--inspect',
    '--expose-gc',
    '--gc-global',
    '--es_staging',
    '--no-deprecation',
    '--prof',
    '--log-timer-events',
    '--throw-deprecation',
    '--trace-deprecation',
    '--use_strict',
    '--allow-natives-syntax',
    '--perf-basic-prof'
];

var FLAG_PREFIXES = [
    '--harmony',
    '--trace',
    '--icu-data-dir',
    '--max-old-space-size',
    '--preserve-symlinks'
];

var DEFAULT_FORCED_KILL_DELAY = 30000;

module.exports = function (cliPath, opts) {
    var useShutdownMessage = opts && opts.useShutdownMessage;
    var forcedKillDelay    = opts && opts.forcedKillDelay || DEFAULT_FORCED_KILL_DELAY;
    var args               = [cliPath];

    process.argv.slice(2).forEach(function (arg) {
        var flag = arg.split('=')[0];

        if (FLAGS.indexOf(flag) > -1) {
            args.unshift(arg);
            return;
        }

        for (var i = 0; i < FLAG_PREFIXES.length; i++) {
            if (arg.indexOf(FLAG_PREFIXES[i]) === 0) {
                args.unshift(arg);
                return;
            }
        }

        args.push(arg);
    });

    var cliProc = spawn(process.execPath, args, { stdio: [process.stdin, process.stdout, process.stderr, useShutdownMessage ? 'ipc' : null] });

    cliProc.on('exit', function (code, signal) {
        if (useShutdownMessage && process.disconnect)
            process.disconnect();

        process.on('exit', function () {
            if (signal)
                process.kill(process.pid, signal);
            else
                process.exit(code);
        });
    });

    process.on('SIGINT', function () {
        function forceKill () {
            cliProc.kill('SIGTERM');
        }

        if (useShutdownMessage)
            cliProc.send('shutdown');
        else
            cliProc.kill('SIGINT');

        setTimeout(forceKill, forcedKillDelay).unref();
    });

    if (useShutdownMessage) {
        process.on('message', function (message) {
            if (message === 'shutdown')
                cliProc.send('shutdown');
        });
    }
};
