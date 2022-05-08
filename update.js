
// ██████ Parameter    █████████████████████████████████████████████████████████

const barFillChar   = "█"
    , barEmptyChar  = "░"
    , barLength     = 20;

// ██████ Integrations █████████████████████████████████████████████████████████

const { WakaTime } 	= require( "wakatime" )
	, { Octokit }	= require( "@octokit/core" )
	, axios         = require( "axios" );

( async () => {

    const waka      = new WakaTime( `${ process.env.WAKATIMETOKEN }` )
        , wakaData  = await waka.stats( "last_7_days" )
        , octokit   = new Octokit({ auth: process.env.GITHUBTOKEN });

    const [
        lunaGuild, languageProgress, coffeeDrink
    ] = await Promise.all( [
        lunaGetGuilds( ),
        generateLanguageChart( wakaData.data.languages ),
        getCoffeeDrink( )
    ] );

    const lastUpdate = new Date().toLocaleDateString( undefined, {
		year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
	});

    const bio = [
        `<h1>   <img src="./spoink.gif" style="vertical-align:middle;" width="30px">   Hello ! </h1>`,
        `Nice to meet you!`,
        `Currently, I'm working on <a href='https://github.com/Asgarrrr/Luna'>\`Luna\`</a>, a Discord bot used by ${ lunaGuild } users with very unique features.`,
        `This week, I've worked on ~${ Math.round( wakaData.data.total_seconds / 60 / 60 ) } hours of coding, and drinked ${ coffeeDrink } coffees ☕`,
        `\`\`\`\n${ languageProgress }\n\`\`\``,
        `###### This presentation is [updated](https://github.com/Asgarrrr) automatically every 5 minute, most recently on ${ lastUpdate } ( UTC±0 ).`,
    ].join( "\n\n" );

    const base64 = new Buffer.from( bio ).toString( "base64" );

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

})();

function generateLanguageChart( languages ) {

    const distribution = [];

    // —— Remove the languages used less than one minute
    languages = languages.filter( languages => languages.total_seconds > 60  )

    // —— Limit the languages to the top 10
    if ( languages.length > 10 )
        languages.length = 10;

    // —— Get the size of the longest language name | Used for perfect fit
    const longest = Math.max( ...languages.map( ( language ) => language.name.length ) );

    for ( let language of languages ) {

        // —— Generate progress bar
        const progress = ( barFillChar.repeat( Math.round( language.percent / 100 * barLength ) ) ).padEnd( barLength, barEmptyChar );

        // —— Generate the complete line
        distribution.push( `${ language.name.padStart( longest, " ") } │ ${ `${ language.percent }%`.padEnd( 8, " " )} ${ progress.padEnd( barLength + 2, " ") } ${ language.text }` );

    }

    return distribution.join( "\n" );

}

async function lunaGetGuilds( guildID ) {

    try {

        const URL = guildID
            ? `https://discord.com/api/guilds/${ guildID }?with_counts=true`
            : "https://discord.com/api/users/@me/guilds"

        const guilds = await axios.get( URL, {
            headers: {
                Authorization: `Bot ${ process.env.DISCORDTOKEN }`
            }
        } );

        // —— Check if the response is ok, and if it is, then get the guilds
        if ( guilds.status !== 200 )
            throw new Error( "Error getting guilds" );

        if ( guildID )
            return guilds.data.approximate_member_count;

        // —— If the guildID is not defined, then get the guilds and then get the members count of each one
        const membersCount = await Promise.all( guilds.data.map( guild => lunaGetGuilds( guild.id ) ) );

        // —— Accumulate the members count
        const totalMembers = membersCount.reduce( ( a, b ) => a + b, 0 );

        return totalMembers;


    } catch ( error ) {

        return 0;

    }

}

async function getCoffeeDrink( ) {

    try {

        const coffeDrink = await axios.get( "https://CoffeDrink.asgarrrrr.repl.co" )

        return coffeDrink.data.count;

    } catch ( error ) {
        return 0

    }

}
