const fs = require('fs');


const data = JSON.parse(fs.readFileSync('groups.json', 'utf8'));


function initializeTeams(group) {
    return group.map(team => ({
        name: team.Team,
        isoCode: team.ISOCode,
        fibaRank: team.FIBARanking,
        points: 0,
        wins: 0,
        losses: 0,
        scoredPoints: 0,
        concededPoints: 0,
        games: []
    }));
}

const teamsGroupA = initializeTeams(data.A);
const teamsGroupB = initializeTeams(data.B);
const teamsGroupC = initializeTeams(data.C);


const fixtures = {
    A: [
        ['Kanada', 'Grčka'], ['Australija', 'Španija'],
        ['Kanada', 'Australija'], ['Grčka', 'Španija'],
        ['Kanada', 'Španija'], ['Australija', 'Grčka']
    ],
    B: [
        ['Nemačka', 'Japan'], ['Francuska', 'Brazil'],
        ['Nemačka', 'Francuska'], ['Japan', 'Brazil'],
        ['Nemačka', 'Brazil'], ['Japan', 'Francuska']
    ],
    C: [
        ['Sjedinjene Države', 'Južni Sudan'], ['Srbija', 'Puerto Riko'],
        ['Sjedinjene Države', 'Srbija'], ['Južni Sudan', 'Puerto Riko'],
        ['Sjedinjene Države', 'Puerto Riko'], ['Srbija', 'Južni Sudan']
    ]
};


function simulateGame(team1, team2) {

    let score1 = 0;
    let score2 = 0;
    let random1= Math.random()*30+70;
    let random2= Math.random()*30+70;

    if(team1.fibaRank<team2.fibaRank){
        const rankDifference = team2.fibaRank - team1.fibaRank;
        const baseProbability = 0.5 + (rankDifference * 0.05);
        const adjustedBaseProbability= Math.max(0.1, Math.min(0.9, baseProbability));
        const baseProbabilityReduced=1-adjustedBaseProbability;
       score1=Math.floor(random1 + (15 * baseProbability))
       score2=Math.floor(random2 - (15 * baseProbabilityReduced))
    }
    else{
        const rankDifference = team1.fibaRank - team2.fibaRank;
        const baseProbability = 0.5 + (rankDifference * 0.05);
        const adjustedBaseProbability= Math.max(0.1, Math.min(0.9, baseProbability));
        const baseProbabilityReduced=1-adjustedBaseProbability;
       score1=Math.floor(random1 - (15 * baseProbability))
       score2=Math.floor(random2 + (15 * baseProbabilityReduced))
    }

    if (score1 > score2) {
        team1.points += 2;
        team1.wins += 1;
        team2.points += 1;
        team2.losses += 1;
    } else {
        team2.points += 2;
        team2.wins += 1;
        team1.points += 1;
        team1.losses += 1;
    }

    team1.scoredPoints += score1;
    team1.concededPoints += score2;
    team2.scoredPoints += score2;
    team2.concededPoints += score1;
 
    team1.games.push({ opponent: team2.name, result: `${score1}:${score2}` });
    team2.games.push({ opponent: team1.name, result: `${score2}:${score1}` });

    return [score1, score2];
}

function simulateMatchesForRounds(groupName, teams, fixtures) {
    const rounds = [[], [], []];
    fixtures.forEach((fixture, index) => {
        rounds[Math.floor(index / 2)].push(fixture);
    });

    rounds.forEach((round, roundIndex) => {
        console.log(`Grupna faza - ${roundIndex + 1}. kolo - Grupa ${groupName}:`);
        round.forEach(([team1Name, team2Name]) => {
            const team1 = teams.find(t => t.name === team1Name);
            const team2 = teams.find(t => t.name === team2Name);
            const [score1, score2] = simulateGame(team1, team2);
            console.log(`    ${team1.name} - ${team2.name} (${score1}:${score2})`);
        });
        console.log();
    });
}

function rankTeams(group) {
    return group.sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        const aPointDifference = a.scoredPoints - a.concededPoints;
        const bPointDifference = b.scoredPoints - b.concededPoints;
        if (aPointDifference !== bPointDifference) return bPointDifference - aPointDifference;
        return b.scoredPoints - a.scoredPoints;
    });
}

function printResults(groups) {
    console.log('\nKonačan plasman u grupama:');
    groups.forEach((group, index) => {
        console.log(`    Grupa ${String.fromCharCode(65 + index)} (Ime - pobede/porazi/bodovi/postignuti koševi/primljeni koševi/koš razlika):`);
        rankTeams(group).forEach((team, rank) => {
            const pointDifference = team.scoredPoints - team.concededPoints;
            console.log(`        ${rank + 1}. ${team.name.padEnd(12)} ${team.wins} / ${team.losses} / ${team.points} / ${team.scoredPoints} / ${team.concededPoints} / ${pointDifference >= 0 ? '+' : ''}${pointDifference}`);
        });
    });

    console.log('\nTop 8 Timova:');
    const topTeams = [
        ...rankTeams(teamsGroupA).slice(0, 3),
        ...rankTeams(teamsGroupB).slice(0, 3),
        ...rankTeams(teamsGroupC).slice(0, 3)
    ].sort((a, b) => b.points - a.points).slice(0, 8);

    topTeams.forEach((team, index) => {
        console.log(`${index + 1}: ${team.name}`);
    });

    return topTeams;
}

function createPots(qualifiedTeams) {
    return {
        D: qualifiedTeams.slice(0, 2),  
        E: qualifiedTeams.slice(2, 4),  
        F: qualifiedTeams.slice(4, 6),  
        G: qualifiedTeams.slice(6, 8)   
    };
}

function createroundOf8Pairs(pots) {
    const roundOf8 = [];

    const pairTeams = (pot1, pot2) => {
        const availableTeams1 = [...pots[pot1]];
        const availableTeams2 = [...pots[pot2]];
        while (availableTeams1.length > 0 && availableTeams2.length > 0) {
            const team1 = availableTeams1.splice(Math.floor(Math.random() * availableTeams1.length), 1)[0];
            const team2 = availableTeams2.splice(Math.floor(Math.random() * availableTeams2.length), 1)[0];
            roundOf8.push([team1.name, team2.name]);
        }
    };

    pairTeams('D', 'E');  
    pairTeams('F', 'G');  

    return roundOf8;
}

function simulateKnockoutStage(teams) {
    const sortedTeams = teams.sort((a, b) => b.points - a.points).slice(0, 8);
    const pots = createPots(sortedTeams);
    let roundElimination = createroundOf8Pairs(pots);

    function printPotsAndPairs() {
        const pots = createPots(topTeams);
        roundElimination = createroundOf8Pairs(pots); 
    
        console.log('\nŠeširi:');
        Object.keys(pots).forEach(potName => {
            console.log(`    ${potName}: ${pots[potName].map(team => team.name).join(', ')}`);
        });
        console.log('\nEliminacion faza:');
        roundElimination.forEach(([team1Name, team2Name]) => {
            console.log(`    ${team1Name} - ${team2Name}`);
        });
    
        console.log();
    }
    
    printPotsAndPairs();
    
    console.log('Četvrtfinale:');
    const semifinals = [];
    roundElimination.forEach(([team1Name, team2Name]) => {
        const team1 = sortedTeams.find(t => t.name === team1Name);
        const team2 = sortedTeams.find(t => t.name === team2Name);
        if (team1 && team2) {
            const [score1, score2] = simulateGame(team1, team2);
            console.log(`    ${team1.name} - ${team2.name} (${score1}:${score2})`);
            if (score1 > score2) {
                semifinals.push(team1);
            } else {
                semifinals.push(team2);
            }
        }
    });
    
    console.log();

    console.log('Polufinale:');
    const finalTeams = [];
    for (let i = 0; i < semifinals.length; i += 2) {
        const team1 = semifinals[i];
        const team2 = semifinals[i + 1];
        const [score1, score2] = simulateGame(team1, team2);
        console.log(`    ${team1.name} - ${team2.name} (${score1}:${score2})`);
        if (score1 > score2) {
            finalTeams.push(team1);
        } else {
            finalTeams.push(team2);
        }
    }
    console.log();

    console.log('Utakmica za treće mesto:');
    const [thirdPlaceTeam1, thirdPlaceTeam2] = semifinals.filter(team => !finalTeams.includes(team));
    const [score1, score2] = simulateGame(thirdPlaceTeam1, thirdPlaceTeam2);
    console.log(`    ${thirdPlaceTeam1.name} - ${thirdPlaceTeam2.name} (${score1}:${score2})`);
    console.log();
    
 
    console.log('Finale:');
    const [finalist1, finalist2] = finalTeams;
    const [finalScore1, finalScore2] = simulateGame(finalist1, finalist2);
    console.log(`    ${finalist1.name} - ${finalist2.name} (${finalScore1}:${finalScore2})`);
    console.log();
    
   
    console.log('Medalje:');
    let gold, silver, bronze;

    gold = finalScore1 > finalScore2 ? finalist1 : finalist2;
    silver = finalScore1 > finalScore2 ? finalist2 : finalist1;
    bronze = score1 > score2 ? thirdPlaceTeam1 : thirdPlaceTeam2;
    
    console.log(`    1. ${gold.name}`);
    console.log(`    2. ${silver.name}`);
    console.log(`    3. ${bronze.name}`);
}


simulateMatchesForRounds('A', teamsGroupA, fixtures.A);
simulateMatchesForRounds('B', teamsGroupB, fixtures.B);
simulateMatchesForRounds('C', teamsGroupC, fixtures.C);
const topTeams = printResults([teamsGroupA, teamsGroupB, teamsGroupC]);

simulateKnockoutStage(topTeams);
