var os = require('os');
var path = require('path'),
    xml2js = require('xml2js'),
    glob = require('glob'),
    exec = require('child_process').exec;


function buildJson(jsonStr) {
    return new Promise(function (resolve, reject) {
        // console.log('jsonStr', jsonStr);
        const obj = JSON.parse(jsonStr);
        resolve(obj);

        // xml2js.parseString(xml, function (err, obj) {
        //     if (err) return reject(err);
        //     console.log('obj', obj);

        //     if (!obj['Mediainfo']) return reject('Something went wrong');

        //     obj = obj['Mediainfo'];

        //     var out = [];

        //     if (Array.isArray(obj.File)) {
        //         for (var i in obj.File) {
        //             out.push(buildOutput(obj.File[i]));
        //         }
        //     } else {
        //         out.push(buildOutput(obj.File));
        //     }
        // });
    });
}

function safeLocalPath(path) {
    if (process.platform.match('win32')) {
        path = '"' + path + '"';// wrap with double quotes
    } else {
        path = path.replace(/'/g, "'\"'\"'"); // escape single quotes
        path = "'" + path + "'";// wrap with single quotes
    }
    return path;
}

function MediaInfo(mi_path, media_path) {
    var cmd_options = {};
    var cmd = [];

    cmd.push(safeLocalPath(mi_path)); // base command
    cmd.push('--Output=JSON --Full'); // args
    Array.prototype.slice.apply([media_path]).forEach(function (val, idx) {
        var files = glob.sync(val, { cwd: (cmd_options.cwd || process.cwd()), nonull: true });
        for (var i in files) {
            cmd.push(safeLocalPath(files[i])); // files
        }
    });

    return new Promise(function (resolve, reject) {
        exec(cmd.join(' '), cmd_options, function (error, stdout, stderr) {
            if (error !== null || stderr !== '') return reject(error || stderr);
            buildJson(stdout).then(resolve).catch(reject);
        });
    });
};


var platform = os.platform()
//patch for compatibilit with electron-builder, for smart built process.
if (platform == "darwin") {
    platform = "mac";
} else if (platform == "win32") {
    platform = "win";
}
//adding browser, for use case when module is bundled using browserify. and added to html using src.
if (platform !== 'linux' && platform !== 'mac' && platform !== 'win' && platform !== "browser") {
    console.error('Unsupported platform.', platform);
    process.exit(1)
}

var arch = os.arch()
if (platform === 'mac' && (arch !== 'x64' && arch !== 'arm64')) {
    console.error('Unsupported architecture.')
    process.exit(1)
}

var path = path.join(
    __dirname,
    'bin',
    platform,
    arch,
    platform === 'win' ? 'mediainfo.exe' : 'mediainfo'
)

exports.path = path;
exports.mi = MediaInfo;