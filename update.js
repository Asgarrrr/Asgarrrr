// ██████ Integrations █████████████████████████████████████████████████████████

const { WakaTime } 	= require( "wakatime" )
	, { Octokit }	= require( "@octokit/core" );

void async function main( ) {

    const waka      = new WakaTime( `${ process.env.WAKATIMETOKEN }` )
        , wakaData  = await waka.stats( "last_7_days" );

    const output    = [
        "```console",
        "$ curl -s https://raw.githubusercontent.com/Asgarrrr/Asgarrrr/master/hello.sh | sh",
        "",
        " _____                             ",
        "|  _  |___ ___ ___ ___ ___ ___ ___ ",
        "|     |_ -| . | .'|  _|  _|  _|  _|",
        "|__|__|___|_  |__,|_| |_| |_| |_|  ",
        "          |___|                    ",
        "├── From France.",
        "├── Born on 2000.11.14",
        "└── Joined Github on 2017.02.17",
        "",
        `$ waka stats --user Asgarrrr --from ${ new Date( Date.now( ) - 604800000 ).toISOString( ).split( "T" )[ 0 ] } --to ${ new Date( ).toISOString( ).split( "T" )[ 0 ] }`,
        "",
    ]

    let maxLangNameLength = 7;

    wakaData.data.languages.length = 7;

    for ( const lang of wakaData.data.languages )
        if ( lang && lang.name.length > maxLangNameLength )
            maxLangNameLength = lang.name.length;

    // If we have hour > 10, we need to add 1 to the max length to avoid the hour to be on the same line as the name
    const hourPrefixed = wakaData.data.languages.some( lang => lang.hours >= 10 );
    const minsPrefixed = wakaData.data.languages.some( lang => lang.minutes >= 10 );

    for ( const language of wakaData.data.languages ) {

        if( !language )
            continue;

        // ── Skip if language is not used more than 1 minute
        if ( language.total_seconds < 60 )
            continue;

        const name          = language.name.padStart( maxLangNameLength +1, " " );
        const percentage    = language.percent.toString().padEnd( 4, 0 ).padStart( 5, " " );
        const loadbar       = "█".repeat( Math.round( language.percent / 5 ) ).padEnd( 18, " " );
        const time          = `${ ( hourPrefixed && language.hours ) < 10 ? " " : "" }${ language.hours } hr${ language.hours > 1 ? "s" : " " } ${ minsPrefixed && language.minutes < 10 ? 0 : "" }${ language.minutes } min${ language.minutes > 1 ? "s" : " " }`;

        output.push( `${ name }  │  ${ percentage }%  ${ loadbar }   ${ time }` );

    }

    const lastUpdate = new Date( ).toLocaleDateString( "fr-FR", {
	    year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
	});

    output.push(
        "~ Total ".padStart( maxLangNameLength + 2, " " ) + "─┴─────────────────────────────> " + wakaData.data.human_readable_total,
        "",
        "$ ls Asgarrrr",
        "├── README.md",
        "│",
        "├── Languages",
        "│   ├── HTML        CSS         TypeScript      NodeJS",
        "│   └── PHP         C           C++             Python",
        "│",
        "├── Frameworks",
        "│   ├── Bootstrap   React       TailwindCSS     Symfony",
        "│   └── Vue         ",
        "│",
        "├── Tools",
        "│   ├── VSCode      WebStorm    PyCharm         Docker",
        "│   ├── Git         GitHub      Vercel          Railway",
        "│   ├── Sketch      Figma       Discord         Visual Studio",
        "│   └── Xcode       ",
        "│",
        "└── Databases",
        "    └── MySQL       SQLite      MongoDB         Redis",
        "```",
        `###### This presentation is [updated](https://github.com/Asgarrrr/Asgarrrr/blob/main/update.js) automatically every 2 hours, most recently on ${ lastUpdate } ( UTC±2 )`
    );

    // ── Update README.md
    const octokit = new Octokit({ auth: process.env.GITHUBTOKEN });
    const base64 = new Buffer.from( output.join( "\n" ) ).toString( "base64" );

    const { data: { sha } } = await octokit.request( "GET /repos/{owner}/{repo}/contents/{path}", {
        owner	: "Asgarrrr",
        repo	: "Asgarrrr",
        path	: "README.md"
    });

    await octokit.request( "PUT /repos/{owner}/{repo}/contents/{path}", {
        owner	: "Asgarrrr",
        repo	: "Asgarrrr",
        path	: "README.md",
        message	: "update",
        content	: base64,
        sha		: sha
    });

    console.log( "Successfully updated the README.md" );

}()
