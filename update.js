// ██████ Integrations █████████████████████████████████████████████████████████

const { WakaTime } 	= require( "wakatime" )
	, { Octokit }	= require( "@octokit/core" );

// ██████ Stack ████████████████████████████████████████████████████████████████
// ── Edit here, the tree below is rendered from this. Rows wrap every 4 columns.

const STACK = {
    Languages   : [ "TypeScript", "Rust", "JavaScript", "Python", "C", "C++", "PHP", "Shell" ],
    Frameworks  : [ "React", "Next.js", "Elysia", "Vue", "TailwindCSS", "Vite", "Symfony" ],
    Tools       : [ "Bun", "Biome", "Docker", "VSCode", "WebStorm", "Git", "GitHub", "Vercel", "Railway", "Turborepo", "Figma" ],
    Databases   : [ "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis" ]
};

const COLUMNS   = 4
    , COLUMN_W  = 14;

// ██████ Helpers ██████████████████████████████████████████████████████████████

const isoDay = timestamp => new Date( timestamp ).toISOString( ).split( "T" )[ 0 ];

// ── Renders "├── Name" followed by its padded rows, the last section closes with └──
function renderSection( name, items, isLast ) {

    const rows = [ ];

    for ( let i = 0; i < items.length; i += COLUMNS )
        rows.push( items.slice( i, i + COLUMNS ).map( item => item.padEnd( COLUMN_W, " " ) ).join( "" ).trimEnd( ) );

    const gutter = isLast ? " " : "│";

    return [
        `${ isLast ? "└" : "├" }── ${ name }`,
        ...rows.map( ( row, i ) => `${ gutter }   ${ i === rows.length - 1 ? "└" : "├" }── ${ row }` )
    ];

}

// ── Last 7 days of stats, or null when WakaTime is unset, unreachable or idle
async function fetchWaka( ) {

    if ( !process.env.WAKATIMETOKEN )
        return null;

    try {

        const waka  = new WakaTime( `${ process.env.WAKATIMETOKEN }` )
            , stats = await waka.stats( "last_7_days" );

        return stats?.data ?? null;

    } catch ( error ) {

        console.warn( `WakaTime unavailable, skipping the stats block — ${ error.message }` );
        return null;

    }

}

// ██████ Main █████████████████████████████████████████████████████████████████

void async function main( ) {

    const output = [
        "```console",
        "$ curl -s https://raw.githubusercontent.com/Asgarrrr/Asgarrrr/main/hello.sh | sh",
        "",
        " _____                             ",
        "|  _  |___ ___ ___ ___ ___ ___ ___ ",
        "|     |_ -| . | .'|  _|  _|  _|  _|",
        "|__|__|___|_  |__,|_| |_| |_| |_|  ",
        "          |___|                    ",
        "├── From France.",
        "├── Born on 2000.11.14",
        "└── Joined Github on 2017.02.17",
        ""
    ];

    // ── The whole block is dropped when the week is empty, rather than publishing
    //    "~ Total ─> 0 secs" on the profile.
    const wakaData  = await fetchWaka( )
        , languages = ( wakaData?.languages ?? [ ] )
            .filter( language => language && language.total_seconds >= 60 )
            .slice( 0, 7 );

    if ( languages.length ) {

        output.push(
            `$ waka stats --user Asgarrrr --from ${ isoDay( Date.now( ) - 604800000 ) } --to ${ isoDay( Date.now( ) ) }`,
            ""
        );

        const maxLangNameLength = Math.max( 7, ...languages.map( language => language.name.length ) )
            , hourPrefixed      = languages.some( language => language.hours   >= 10 )
            , minsPrefixed      = languages.some( language => language.minutes >= 10 );

        for ( const language of languages ) {

            const name          = language.name.padStart( maxLangNameLength + 1, " " );
            const percentage    = language.percent.toString( ).padEnd( 4, 0 ).padStart( 5, " " );
            const loadbar       = "█".repeat( Math.round( language.percent / 5 ) ).padEnd( 18, " " );
            const hours         = `${ hourPrefixed && language.hours   < 10 ? " " : "" }${ language.hours }`;
            const minutes       = `${ minsPrefixed && language.minutes < 10 ? "0" : "" }${ language.minutes }`;
            const time          = `${ hours } hr${ language.hours > 1 ? "s" : " " } ${ minutes } min${ language.minutes > 1 ? "s" : " " }`;

            output.push( `${ name }  │  ${ percentage }%  ${ loadbar }   ${ time }` );

        }

        output.push(
            "~ Total ".padStart( maxLangNameLength + 2, " " ) + "─┴─────────────────────────────> " + wakaData.human_readable_total,
            ""
        );

    }

    output.push( "$ ls Asgarrrr", "├── README.md", "│" );

    const sections = Object.entries( STACK );

    sections.forEach( ( [ name, items ], index ) => {
        output.push( ...renderSection( name, items, index === sections.length - 1 ) );
        if ( index < sections.length - 1 )
            output.push( "│" );
    } );

    const lastUpdate = new Date( ).toLocaleDateString( "fr-FR", {
	    year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
	});

    output.push(
        "```",
        `###### This presentation is [updated](https://github.com/Asgarrrr/Asgarrrr/blob/main/update.js) automatically every Sunday, most recently on ${ lastUpdate } ( UTC±2 )`
    );

    // ── Update README.md
    const octokit = new Octokit({ auth: process.env.GITHUBTOKEN });
    const base64 = Buffer.from( output.join( "\n" ) ).toString( "base64" );

    const { data: { sha } } = await octokit.request( "GET /repos/{owner}/{repo}/contents/{path}", {
        owner	: "Asgarrrr",
        repo	: "Asgarrrr",
        path	: "README.md"
    });

    await octokit.request( "PUT /repos/{owner}/{repo}/contents/{path}", {
        owner	: "Asgarrrr",
        repo	: "Asgarrrr",
        path	: "README.md",
        message	: "chore(readme): weekly refresh",
        content	: base64,
        sha		: sha
    });

    console.log( "Successfully updated the README.md" );

}()
