const fs = require("fs");
const readline = require("readline");

let filenames = [];
const dir = "./unzipped/";

// List files in unzipped dir
fs.readdirSync(dir).forEach((filename) => {
    filenames.push(dir + filename);
});

const filename = filenames[0];
const file = readline.createInterface({
    input: fs.createReadStream(filename),
    output: process.stdout,
    terminal: false,
});

function surfaceInfo(surface) {
    let resources = [];
    let resourceKeys = Object.keys(surface.resource).sort((a, b) => {
        return surface.resource[b] - surface.resource[a];
    });
    for (let i = 0; i < Math.min(6, resourceKeys.length); i++) {
        resources.push(resourceKeys[i]);
        resources.push(Math.floor(surface.resource[resourceKeys[i]] * 10000) / 10000);
    }
    return [
        surface.name,
        surface.delta_v,
        surface.zone_type,
        surface.tags.enemy,
        surface.tags.water,
        ...resources,
    ];
}

function printTable(table) {
    let columnWidths = [];
    // For each row
    for (let i = 0; i < table.length; i++) {
        // For each column
        for (let j = 0; j < table[i].length; j++) {
            if (!columnWidths[j]) columnWidths[j] = 0;
            if (table[i][j].toString().length > columnWidths[j])
                columnWidths[j] = table[i][j].toString().length;
        }
    }
    // For each row
    for (let i = 0; i < table.length; i++) {
        let padded = "";
        // For each column
        for (let j = 0; j < table[i].length; j++) {
            let temp = table[i][j];
            // Add padding according to the calculated column widths
            while (temp.toString().length < columnWidths[j]) {
                temp += " ";
            }
            // Add an extra space between items
            padded += temp + " ";
        }
        console.log(padded);
    }
}

file.on("line", (line) => {
    let seedObject = JSON.parse(line);
    const modules = seedObject.loot.join("");
    if (modules.match(/^PPSS/)) {
        console.log(`seed: ${seedObject.seed} modules: ${modules}`);
        const planetsAndMoons = [...seedObject.moons, ...seedObject.planets].sort((a, b) => {
            return a.delta_v - b.delta_v;
        });
        let table = [];
        for (let i = 0; i < planetsAndMoons.length; i++) {
            table.push(surfaceInfo(planetsAndMoons[i]));
        }
        printTable(table);
        process.exit(0);
    }
});
