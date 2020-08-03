export enum Interval {
    UNISON = 0,
    MINOR_SECOND = 1,
    MAJOR_SECOND = 2,
    MINOR_THIRD = 3,
    MAJOR_THIRD = 4,
    PERFECT_FOURTH = 5,
    TRITONE = 6,
    PERFECT_FIFTH = 7,
    MINOR_SIXTH = 8,
    MAJOR_SIXTH = 9,
    MINOR_SEVENTH = 10,
    MAJOR_SEVENTH = 11
}

export enum Pitch {
  C = 0,
  Cs,
  D,
  Ds,
  E,
  F,
  Fs,
  G,
  Gs,
  A,
  As,
  B
}
export type Octave = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export class Note {
  private _pitch: Pitch;
  private _octave: Octave;

  constructor(pitch: Pitch, octave: Octave) {
    this._pitch = pitch;
    this._octave = octave;
  }

  get pitch(): Pitch {
    return this._pitch;
  }

  get octave(): Octave {
    return this._octave;
  }

  equals(other: Note): boolean {
    return this.pitch === other.pitch && this.octave === other.octave;
  }

  toString(): string {
    return Pitch[this.pitch].replace('s', '#') + this.octave;
  }

  getSemitoneValue(): number {
    return 12 * this.octave + this.pitch;
  }

  compare(other: Note): -1 | 0 | 1 {
    if(this.getSemitoneValue() < other.getSemitoneValue()) return -1;
    if(this.getSemitoneValue() > other.getSemitoneValue()) return 1;
    return 0;
  }

  getInterval(relativeNote: Note): Interval {
    const semitoneDistance = relativeNote.pitch - this.pitch;
    return semitoneDistance < 0 ? semitoneDistance + 12 : semitoneDistance;
  }
}

export class Chord {
  private _root: Note;
  private _bass: Note;
  private _intervals: Set<Interval>;
  private _name: string;
  private _prob: number;

  constructor(root: Note, bass: Note, intervals?: Set<Interval>) {
    this._root = root;
    this._bass = bass;
    this._intervals = intervals ?? new Set<Interval>();
    this._name = Pitch[root.pitch];
    this._prob = 0;

    this.determineChordName();
  }

  get prob(): number {
      return this._prob;
  }

  toString(): string {
    return this._name;
  }

  addNewInterval(interval: Interval): void {
    this._intervals.add(interval);
    this.determineChordName();
  }

  sortNoteNames = (first: string, second: string): -1 | 0 | 1 => {
    if(first[0] === 'b' || second[0] === '#' || first === '7') return -1;
    if(first[0] === '#' || second[0] === 'b' || first === 'maj7') return 1;
    throw new Error('Invalid labels');
  }

  fillExtensionNotes(remainingNotes: Map<number, Array<string>>): void {
    remainingNotes.forEach((labels, name) => {

    });

    while(remainingNotes.size > 0) {
      const lowestInterval = Math.min(...remainingNotes.keys());
      const labels = remainingNotes.get(lowestInterval) ?? [];
      remainingNotes.delete(lowestInterval);

      switch(labels.length) {
        case(3):
        case(2):
          let tempName = [...'add('];
          labels.sort(this.sortNoteNames).forEach((label) => {
            tempName = [...tempName, `${label},`];
          });
          tempName[tempName.length - 1] = ')';
          this._name = tempName.toString();
          break;
        case(1):
          const extensionNoteName = labels[0];
          this._name += extensionNoteName[0] === 'b' || extensionNoteName[0] === '#' ? `add(${extensionNoteName})` : `add${extensionNoteName}`;
          break;
      }
    }
  }

  handleExtensionNotes(isMajorChord: boolean, isPowerChord: boolean = false): void {
    const {
      MINOR_SECOND, MAJOR_SECOND,
      MINOR_THIRD,
      PERFECT_FOURTH, TRITONE,
      MINOR_SIXTH, MAJOR_SIXTH,
      MINOR_SEVENTH, MAJOR_SEVENTH
    } = Interval;

    type NoteValueNamePair = {
      value: number,
      name: string
    }

    const nameLookup: Map<Interval, NoteValueNamePair> = new Map([
      [MINOR_SEVENTH, { value: 7, name: '7'}],
      [MAJOR_SEVENTH, { value: 7, name: 'maj7'}],
      [MINOR_SECOND, { value: 9, name: 'b9'}],
      [MAJOR_SECOND, { value: 9, name: '9'}],
      [MINOR_THIRD, { value: 9, name: '#9'}],
      [PERFECT_FOURTH, { value: 11, name: '11'}],
      [TRITONE, { value: 11, name: '#11'}],
      [MINOR_SIXTH, { value: 13, name: 'b13'}],
      [MAJOR_SIXTH, { value: 13, name: '13'}]
    ]);

    type ExtensionNoteInterval = 7 | 9 | 11 | 13;

    const extensionNotes: Map<ExtensionNoteInterval, Array<string>> = new Map([
      [7, []],
      [9, []],
      [11, []],
      [13, []]
    ]);

    this._intervals.forEach((interval) => {
      if(interval === MINOR_THIRD && !isMajorChord) return;
      const pair: NoteValueNamePair | undefined = nameLookup.get(interval);
      if(pair !== undefined) {
        const { name } = pair;
        const value = <ExtensionNoteInterval> pair.value;
        extensionNotes.set(value, [...(extensionNotes.get(value) ?? []), name])
      }
    });

    console.log(extensionNotes);

    // case: no extension notes or sevenths
    if(!(Array.from(extensionNotes.values()).some((label) => label.length > 0))) return;

    // case: seventh(s) present
    const sevenths = extensionNotes.get(7) ?? [];
    extensionNotes.delete(7);
    if(sevenths.length !== 0) {
      if(isPowerChord) this._name += 'add';

      // case: min7 and maj7
      if(sevenths.length === 2) {
        this._name += '(7, maj7)';
        this.fillExtensionNotes(extensionNotes);
        return;
      }

      // case: either min7 or maj7
      while(extensionNotes.size > 0) {
        const lowestInterval = <ExtensionNoteInterval> Math.min(...extensionNotes.keys());
        const nextLowestIntervalLabels = extensionNotes.get(lowestInterval) ?? [];
        extensionNotes.delete(lowestInterval);

        if(nextLowestIntervalLabels.length === 0) continue;

        if(sevenths[0] === 'maj7') this._name += 'maj';
  
        switch(nextLowestIntervalLabels.length) {
          case(3):
          case(2):
            let tempName = ['('];
            nextLowestIntervalLabels.sort(this.sortNoteNames).forEach((label) => {
              tempName = [...tempName, `${label},`];
            });
            tempName[tempName.length - 1] = ')';
            this._name = tempName.toString();
            break;
          case(1):
            const noteName = nextLowestIntervalLabels[0];
            this._name += noteName.length > 1 ? `(${noteName})` : noteName;
            break;
        }

        this.fillExtensionNotes(extensionNotes);
        return;
      }

      // case: no extension notes
      this._name += !isMajorChord && this._intervals.has(MINOR_THIRD) && sevenths[0] === 'maj7' ? 'maj7' : sevenths[0];
      return;
    }

    // case: no sevenths present, but sixth(s) are
    const sixths = extensionNotes.get(13) ?? [];
    extensionNotes.delete(13);
    if(sixths.length !== 0) {
      if(isPowerChord) this._name += 'add';

      // case: min6 and maj6
      switch(sixths.length) {
        case(2):
          this._name += '(min6, 6)';
          break;
        case(1):
          const sixthName = sixths[0];
          this._name += !isMajorChord && this._intervals.has(MINOR_THIRD) && sixthName === 'b13' ? '(min6)' : sixthName;
          break;
      }

      this.fillExtensionNotes(extensionNotes);
      return;
    }

    // case: no sevenths or sixths
    this.fillExtensionNotes(extensionNotes);
  }

  handleSuspendedNotes(): void {
    const {
      MINOR_SECOND, MAJOR_SECOND,
      PERFECT_FOURTH, TRITONE,
    } = Interval;

    if(this._intervals.has(MINOR_SECOND) || this._intervals.has(MAJOR_SECOND)) {
      this._name += this._intervals.has(MINOR_SECOND) ? 'sus2(b2)' : 'sus2';
    }

    if(this._intervals.has(PERFECT_FOURTH) || this._intervals.has(TRITONE)) {
      this._name += this._intervals.has(TRITONE) ? 'sus(#4)' : 'sus4';
    }
  }

  handleTriad(): void {
    const {
      MINOR_THIRD, MAJOR_THIRD
    } = Interval;

    if(this._intervals.has(MINOR_THIRD)) { this._name += 'm'; }
    this.handleExtensionNotes(this._intervals.has(MAJOR_THIRD));
  }

  handlePowerChord(): void {
    const {
      MINOR_SECOND, MAJOR_SECOND,
      MINOR_THIRD, MAJOR_THIRD,
      PERFECT_FOURTH, TRITONE,
      PERFECT_FIFTH
    } = Interval;

    const hasSecond: boolean = this._intervals.has(MINOR_SECOND) || this._intervals.has(MAJOR_SECOND);
    const hasFourth: boolean = this._intervals.has(PERFECT_FOURTH) || this._intervals.has(TRITONE);
    const hasDimFifth = this._intervals.has(TRITONE);

    if(hasSecond || hasFourth) {
      let susTwo: Interval | false = false;
      let susFour: Interval | false = false;

      if(this._intervals.has(MAJOR_SECOND)) {
        susTwo = MAJOR_SECOND;
        this._intervals.delete(MAJOR_SECOND);
      } else if(this._intervals.has(MINOR_SECOND)) {
        susTwo = MINOR_SECOND;
        this._intervals.delete(MINOR_SECOND);
      }

      if(this._intervals.has(PERFECT_FOURTH)) {
        susFour = PERFECT_FOURTH;
        this._intervals.delete(PERFECT_FOURTH);
      } else if(this._intervals.has(TRITONE)) {
        susFour = TRITONE;
        this._intervals.delete(TRITONE);
      }

      this.handleExtensionNotes(this._intervals.has(MAJOR_THIRD));

      !!susTwo && this._intervals.add(susTwo);
      !!susFour && this._intervals.add(susFour);
      this.handleSuspendedNotes();
    } else {
      this._name += '5';
      this.handleExtensionNotes(this._intervals.has(MAJOR_THIRD), true);
    }

    if(hasDimFifth) this._name += '(b5)';
  }

  handleDyad(): void {
    const {
      MINOR_THIRD, MAJOR_THIRD,
    } = Interval;

    if(this._intervals.has(MINOR_THIRD)) this._name += 'm';

    this.handleExtensionNotes(this._intervals.has(MAJOR_THIRD));
    this._name += '(no5)';
  }

  handleDiminished(): void {
    const {
      MAJOR_SIXTH, MINOR_SEVENTH, MAJOR_SEVENTH
    } = Interval;

    const dimFifthIsRoot = this._intervals.has(MINOR_SEVENTH) && this._intervals.has(MAJOR_SEVENTH);
    const dimSeventhIsRoot = this._intervals.has(MAJOR_SIXTH) && (this._intervals.has(MINOR_SEVENTH) || this._intervals.has(MAJOR_SEVENTH));

    if(dimFifthIsRoot || dimSeventhIsRoot) {
      this._prob = -1;
      return;
    }

    if(this._intervals.has(MAJOR_SIXTH)) { // dim7 chord
      this._intervals.delete(MAJOR_SIXTH);
      this._name += '°7';
      this.handleExtensionNotes(false);
    } else if(this._intervals.has(MINOR_SEVENTH)) { // m7b5 chord
      this._name += 'm';
      this.handleExtensionNotes(false);
      this._name += '(b5)'
    } else { // dim chord with no 7ths
      this._name += '°';
      this.handleExtensionNotes(false);
    }
  }

  handleAugmented(): void {
    const {
      MINOR_SIXTH
    } = Interval;

    this._intervals.delete(MINOR_SIXTH);

    this._name += '+';
    this.handleExtensionNotes(false);
  }

  determineChordName(): void {
    const {
      MINOR_SECOND, MAJOR_SECOND,
      MINOR_THIRD, MAJOR_THIRD,
      PERFECT_FOURTH, TRITONE,
      PERFECT_FIFTH,
      MINOR_SIXTH
    } = Interval;

    const hasThird: boolean = this._intervals.has(MINOR_THIRD) || this._intervals.has(MAJOR_THIRD);
    const hasFifth: boolean = this._intervals.has(PERFECT_FIFTH);

    if(this._name.includes('s')) {
      this._name = this._intervals.has(MINOR_THIRD) ? this._name.replace('s', '#') : Interval[this._root.pitch + 1] + 'b';
    }

    if(hasFifth && hasThird) {
      this.handleTriad();
    } else if(this._intervals.has(MINOR_THIRD) && this._intervals.has(TRITONE)) {
      this.handleDiminished();
    } else if(this._intervals.has(MAJOR_THIRD) && this._intervals.has(MINOR_SIXTH)) {
      this.handleAugmented();
    } else if(hasFifth || this._intervals.has(TRITONE)) {
      this.handlePowerChord();
    } else if(hasThird) {
      this.handleDyad();
    } else { // no chord
      this.handleExtensionNotes(false);
      this._name += '(N/C)';
      this._prob = 0;
    }

    if(this._root !== this._bass) {
      this._name += '/';
      const bassNoteName = Pitch[this._bass.pitch];

      if(bassNoteName.includes('s')) {
        this._name += this._intervals.has(MINOR_THIRD) ? bassNoteName.replace('s', '#') : Interval[this._bass.pitch + 1] + 'b';
      } else {
        this._name += bassNoteName;
      }

      this._prob -= 0.5; 
    }
  }
}

const root = new Note(Pitch.C, 3);
const second = Interval.MAJOR_SECOND;
const third = Interval.MAJOR_THIRD;
const fifth = Interval.TRITONE;
const seventh = Interval.MINOR_SEVENTH;
const sixth = Interval.MINOR_SIXTH;

//const chord = new Chord(root, root);
//chord.addNewInterval(second);
//chord.addNewInterval(fifth);
//chord.addNewInterval(seventh);
//chord.addNewInterval(third);
//chord.addNewInterval(sixth);
//chord.determineChordName();
//console.log(chord.toString())
