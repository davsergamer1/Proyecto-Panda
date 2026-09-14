const { execFile, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const optimizerDir = path.resolve(__dirname, "../optimizer");
const pythonExec = path.resolve(__dirname, "../../.venv/Scripts/python.exe");

console.log("Testing optimizer execution...");
console.log("optimizerDir:", optimizerDir);
console.log("pythonExec:", pythonExec, "Exists:", fs.existsSync(pythonExec));

const env = { 
  ...process.env, 
  ComSpec: process.env.ComSpec || "C:\\Windows\\System32\\cmd.exe",
  SystemRoot: process.env.SystemRoot || "C:\\Windows",
  PATH: process.env.PATH || process.env.Path || "C:\\Windows\\System32;C:\\Windows"
};

execFile(pythonExec, ["solver.py"], { cwd: optimizerDir, env }, (err, stdout, stderr) => {
  console.log("execFile Result:");
  if (err) {
    console.error("Error:", err);
  } else {
    console.log("Output:", stdout);
  }
});
