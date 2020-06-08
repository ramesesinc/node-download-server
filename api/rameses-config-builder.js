const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const ini = require('ini');

const rfs = require('./rameses-node-files');
const rutil = require('./rameses-node-utils');


const mergeYml = (mfile, pfiles) => {
  pfiles.forEach(pfile => {
    const pyml = yaml.safeLoad(fs.readFileSync(path.join(pfile.dir, pfile.file)));
    
    //merge app.env 
    const menv = mfile.yml.app.env;
    const penv = (pyml.app && pyml.app.env);
    if (menv && penv) {
      for (const key in penv) {
        if (!penv.hasOwnProperty(key)) continue;
        menv[key] = penv[key];
      }
    }

    //merge modules
    let pmodules = [];
    if (pyml.app) pmodules = pyml.app.modules;
    if (!pmodules) pyml.modules;
    if (pmodules && pmodules.length !== 0) {
      const mergeModules = [...mfile.yml.app.modules, ...pmodules];
      mfile.yml.app.modules = mergeModules;
    }
  });
}

const applyEnv = (fenv, obj) => {
  if (!fenv) return;
  
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;

    const value = obj[key];
    if (typeof(value) === 'object') {
      applyEnv(fenv, value);
    } else {
      if (value && typeof(value) === 'string' && value.startsWith('${')) {
        const envKey = value.replace('${', '').replace('}', '');
        obj[key] = fenv[envKey];
      }
    }
  }
}

const applyConf = (conf, obj) => {
  if (!conf) return;

  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;

    const value = obj[key];
    if (typeof(value) === 'object') {
      applyConf(conf, value);
    } else {
      if (value && typeof(value) === 'string') {
        const vars = value.match(/\${(.*)}/)
        if (vars) {
          obj[key] = value.replace(vars[0], conf[vars[1]]);
        }
      }
    }
  }
}

const sortModules = modules => {
  modules.sort((a, b) => {
    if (!a.order) a.order = 0;
    if (!b.order) b.order = 0;
    if (a.order === b.order) return 0;
    return (a.order < b.order ? -1 : 1);
  });
}

const buildEnvXml = mfile => {
  const env = mfile.yml.app.env;
  let xml = '  <env>\n';
  for (const key in env) {
    if (!env.hasOwnProperty(key)) continue;
    xml += '  ' + key + '='  + env[key] + '\n';
  }
  xml += '  </env>\n';
  return xml;
}

const buildModulesXml = mfile => {
  let modules = mfile.yml.app.modules;
  sortModules(modules)

  let xml = '  <modules>\n';

  modules.forEach(mod => {
    xml += '    <module '
    for (const key in mod) {
      if (!mod.hasOwnProperty(key) || excludedKey(key)) continue;
      xml += key + '="'  + mod[key] + '" ';
    }
    xml += ' />\n'
  });

  xml += '  </modules>\n';
  return xml;
}

const excludedKey = (key) => {
  return /(order)/.test(key);
}

const buildXmlConfig = mfile => {
  let xml = '<app>\n';
  xml += buildEnvXml(mfile);
  xml += buildModulesXml(mfile);
  xml += '</app>\n'
  const filename = mfile.file.replace('.myml', '.xml');
  return {filename, xml}
};

const loadConf = rootDir => {
  const confFiles = ['res.conf', 'custom.conf', 'env.conf'];
  try {
    let conf = {};
    confFiles.forEach( confFile => {
      const confFileName = path.join(rootDir, 'public', 'resources', confFile);
      if (fs.existsSync(confFileName)) {
        const newConf = ini.parse(fs.readFileSync(confFileName, 'utf-8'));
        conf = {...conf, ...newConf}
      }
    })
    resolveConfValues(conf);
    return conf;

  } catch(err) {
    console.log('loadConf [ERROR] ', err);
  }
  return null;
}

const resolveConfValues = (conf) => {
  const values = {};
  for (key in conf) {
    if (conf.hasOwnProperty(key) && conf[key]) {
      const val = conf[key];
      if (typeof val !== 'string' || !val.trim().startsWith("${")) {
        values[key] = val;
      }
    }
  }
  let pass = false;
  for (key in conf) {
    if (conf.hasOwnProperty(key) && conf[key]) {
      const keyValue = conf[key];
      if (typeof keyValue === "string" && keyValue.trim().startsWith("${")) {
        const vars = keyValue.match(/\${(.*)}/);
        if (vars && values[vars[1]]) {
          conf[key] = values[vars[1]];
          pass = true;
        }
      }
    }
  }
  if (pass) {
    resolveConfValues(conf);
  }
}

const buildUpdatesXml = (rootDir) => {
  const conf = loadConf(rootDir);
  
  const resourcesDir = path.join(rootDir, 'public', 'resources');
  const mfiles = rfs.findFilesByExt(resourcesDir, "myml");
  const configs = [];
  mfiles.forEach(mfile => {
    try {
      mfile.yml = yaml.safeLoad(fs.readFileSync(path.join(mfile.dir, mfile.file)));
      mfile.pfile = mfile.file.replace('.myml', '.pyml');
      const pfiles = rfs.findFilesByName(resourcesDir, mfile.pfile);
      mergeYml(mfile, pfiles);
      applyConf(conf, mfile.yml);
      const config = buildXmlConfig(mfile);
      configs.push(config);
    } catch (err) {
      const fileName = path.join(mfile.dir, mfile.file);
      console.log('ParseMFile [ERROR] ' + fileName + ': ', err);
      throw err;
    }
  });
  return configs;
}


module.exports = {
  buildUpdatesXml
}



