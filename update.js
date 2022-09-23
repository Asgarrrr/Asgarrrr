// ██████ Integrations █████████████████████████████████████████████████████████

const { WakaTime } 	= require( "wakatime" )
	, { Octokit }	= require( "@octokit/core" );

void async function main( ) {

    const waka      = new WakaTime( `${ process.env.WAKATIMETOKEN }` )
        , wakaData  = await waka.stats( "last_7_days" );

    const output    = [
        "```console",
        "$ curl -s https://raw.githubusercontent.com/Asgarrrr/Asgarrrr/master/hello.sh | bash",
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

    for ( const lang of wakaData.data.languages )
        if ( lang.name.length > maxLangNameLength )
            maxLangNameLength = lang.name.length;

    for ( const language of wakaData.data.languages ) {

        // ── Skip if language is not used more than 1 minute
        if ( language.total_seconds < 60 )
            continue;

        const name       = language.name.padStart( maxLangNameLength +1, " " );
        const percentage = language.percent.toString().padStart( 3, " " ) + "%";
        const loadbar   = "█".repeat( Math.round( language.percent / 5 ) ).padEnd( 20, " " );
        const time       = language.text.padStart( 7, " " );

        output.push( `${ name }  │  ${ language.percent.toString().padStart( 3, " " ) }%  ${ loadbar }   ${ time }` );

    }

    output.push(
        "~ Total ".padStart( maxLangNameLength + 2, " " ) + "─┴─────────────────────────────> " + wakaData.data.human_readable_total,
        "",
        "$ ls Asgarrrr",
        "├── README.md",
        "│",
        "├── Languages",
        "│   ├── HTML        CSS         JavaScript      Python",
        "│   └── PHP         C           C++             ",
        "│",
        "├── Frameworks",
        "│   ├── Bootstrap   React       TailwindCSS     Laravel",
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
        "```"
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