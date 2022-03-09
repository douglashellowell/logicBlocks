import fs from 'fs/promises';

type GuardNum = `#${number}`;
/**
 * ```md
 *  "#24": [<X empty items>, 2, 1, 1, 1, 2, 2, 2, 2]
 *  "#58": [1, 2,<X empty items> 1, 2, 2, 2]
 *  key === guard number
 *      array
 *      index === minutes from 00 > 59
 *      values === times asleep in that minute
 * ```
 */
type GuardRef = {
  [key: GuardNum]: number[];
};

function solution(data: string): void {
  const rows = data.split('\n');
  rows.sort(sortByDateAndTime);

  const guardRef: GuardRef = {};

  // to keep track of guard while looping
  let currentGuard: GuardNum = '#000'; // i hope this default doesn't ruin it lol
  // set fall asleep time then add time asleep to guardRef when they wake
  let fallAsleepTime: string | null = null;

  // create guardRef
  rows.forEach((row) => {
    const matchGuardNum = row.match(/#\d*/);
    const newGuard = matchGuardNum !== null;
    if (newGuard) {
      const newLocal = fallAsleepTime !== null;
      if (newLocal) throw new Error("guard didn't wake up???");
      currentGuard = matchGuardNum[0] as GuardNum;
      if (!guardRef[currentGuard]) {
        guardRef[currentGuard] = [];
      }
    } else {
      // same guard... are they still asleep?
      const fellAsleep = /falls/g.test(row);
      const wokeUp = /wakes/g.test(row);
      if (fellAsleep) {
        fallAsleepTime = getTime(row);
      }
      if (wokeUp) {
        if (!fallAsleepTime) throw new Error("guard didn't fall asleep??");
        const wakeUpTime = getTime(row);
        for (let i = +fallAsleepTime; i < +wakeUpTime; i++) {
          guardRef[currentGuard][i] = guardRef[currentGuard][i]
            ? guardRef[currentGuard][i] + 1
            : 1;
        }
        fallAsleepTime = null;
      }
    }
  });

  const [sleepiestGuard] = guardHabitFinder2000(guardRef, (sleepRecord) => {
    return sleepRecord.reduce((l, o) => (o ? l + o : l), 0); // l  0  l   o  l  0  l  o   l   ...
  });

  // find the biggest number in array, excluding <empty item>s
  const timeMostLikelyToBeAsleep = guardRef[sleepiestGuard].indexOf(
    Math.max(...guardRef[sleepiestGuard].filter((n) => n))
  );

  // 🌟
  console.log(
    `answer 1:`,
    timeMostLikelyToBeAsleep * parseInt(sleepiestGuard.slice(1))
  );

  const [mostConsistentGuard, mostAccumulatedMinute] = guardHabitFinder2000(
    guardRef,
    (sleepRecord) => {
      return Math.max(...sleepRecord.filter((n) => n));
    }
  );

  const mostSleptMinute = guardRef[mostConsistentGuard].indexOf(
    mostAccumulatedMinute
  );

  // 🌟
  console.log(
    `answer 2: `,
    mostSleptMinute * parseInt(mostConsistentGuard.slice(1))
  );
}

/**
 *
 * @param ref GuardRef number array
 * @param statFinder function that parses data and returns number
 * @param betterQuality "high"/"low" - determine which is more important - defaults to high
 * @returns [guardNum, number]
 * @example
 * ```ts
 * // finding the largest num
 * guardHabitFinder2000(ref, (sleepRecord) => {
 *      // out of each guards result - pick the highest one
 *      return Math.max(...sleepRecord).filter(n => n) // to filter out <empty>
 * })
 * // finding the smallest num
 * guardHabitFinder2000(ref, (sleepRecord) => {
 *      // out of each guards result - pick the lowest one
 *      return Math.min(...sleepRecord).filter(n => n) // to filter out <empty>
 * }, 'low')
 * ```
 */
const guardHabitFinder2000 = (
  ref: GuardRef,
  statFinder: (numArr: number[]) => number,
  betterQuality: 'high' | 'low' = 'high'
): [GuardNum, number] => {
  let recordMakingGuard: GuardNum = '#100';
  let recordMakingStat: number = 0;
  for (const g in ref) {
    const guard = g as GuardNum;

    const potentialRecord = statFinder(ref[guard]);

    if (betterQuality === 'high') {
      if (potentialRecord > recordMakingStat) {
        recordMakingStat = potentialRecord;
        recordMakingGuard = guard;
      }
    } else if (betterQuality === 'low') {
      if (potentialRecord < recordMakingStat) {
        recordMakingStat = potentialRecord;
        recordMakingGuard = guard;
      }
    }
  }

  return [recordMakingGuard, recordMakingStat];
};

/**
 * @param row
 * @returns {string} time in 2 digits
 * i.e "53"
 */
const getTime = (row: string) => {
  const match = row.match(/:\d{2}/);
  if (match === null) throw new Error('no minutes found in row :(');
  return match[0].slice(1); // without ':'
};

const sortByDateAndTime = (a: string, b: string) => {
  // [1518-09-01 00:27] wakes up
  const dateA = a.slice(1, 11).split('-').join('');
  const dateB = b.slice(1, 11).split('-').join('');
  // '15180901']
  if (dateA < dateB) return -1;
  if (dateA === dateB) {
    const timeA = a.slice(12, 17);
    const timeB = b.slice(12, 17);
    // '00:58'
    if (timeA < timeB) {
      return -1;
    }
  }
  return 1;
};

async function runSolution() {
  const data = await fs.readFile(`${__dirname}/input.txt`, 'utf-8');
  solution(data);
}

runSolution();
