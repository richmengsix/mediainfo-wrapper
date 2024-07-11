var os = require('os');
var path = require('path'),
    xml2js = require('xml2js'),
    glob = require('glob'),
    exec = require('child_process').exec;

function buildOutput(obj) {
    var out = {};
    var idVid = idAud = idTex = idMen = idOth = 0;

    for (var i in obj.track) {
        if (obj.track[i]['$']['type'] === 'General') {
            out.file = obj.track[i]['Complete_name'][0];
            out.general = {};
            for (var f in obj.track[i]) {
                if (f !== '$') out.general[f.toLowerCase()] = obj.track[i][f];
            }
        } else if (obj.track[i]['$']['type'] === 'Video') {
            if (!idVid) out.video = [];
            out.video[idVid] = {};
            for (var f in obj.track[i]) {
                if (f !== '$') out.video[idVid][f.toLowerCase()] = obj.track[i][f];
            }
            idVid++;
        } else if (obj.track[i]['$']['type'] === 'Audio') {
            if (!idAud) out.audio = [];
            out.audio[idAud] = {};
            for (var f in obj.track[i]) {
                if (f !== '$') out.audio[idAud][f.toLowerCase()] = obj.track[i][f];
            }
            idAud++;
        } else if (obj.track[i]['$']['type'] === 'Text') {
            if (!idTex) out.text = [];
            out.text[idTex] = {};
            for (var f in obj.track[i]) {
                if (f !== '$') out.text[idTex][f.toLowerCase()] = obj.track[i][f];
            }
            idTex++;
        } else if (obj.track[i]['$']['type'] === 'Menu') {
            if (!idMen) out.menu = [];
            out.menu[idMen] = {};
            for (var f in obj.track[i]) {
                if (f !== '$') out.menu[idMen][f.toLowerCase()] = obj.track[i][f];
            }
            idMen++;
        } else {
            if (!idOth) out.other = [];
            out.other[idOth] = {};
            for (var f in obj.track[i]) {
                if (f !== '$') out.other[idOth][f.toLowerCase()] = obj.track[i][f];
            }
            idOth++;
        }
    }
    return out;
}

function buildJson(xml) {
    return new Promise(function (resolve, reject) {
        xml2js.parseString(xml, function (err, obj) {
            if (err) return reject(err);
            if (!obj['Mediainfo']) return reject('Something went wrong');

            obj = obj['Mediainfo'];

            var out = [];

            if (Array.isArray(obj.File)) {
                for (var i in obj.File) {
                    out.push(buildOutput(obj.File[i]));
                }
            } else {
                out.push(buildOutput(obj.File));
            }

            resolve(out);
        });
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
    var cmd_options =  {};
    var cmd = [];

    cmd.push(mi_path); // base command
    cmd.push('--Output=XML --Full'); // args
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