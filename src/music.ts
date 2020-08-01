enum Pitch {
  C = 1,
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
type Octave = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

class Note {
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

  equals(other: Note) {
    return this.pitch === other.pitch && this.octave === other.octave;
  }

  toString(): string {
    return Pitch[this.pitch].replace('s', '#') + this.octave;
  }

  getSemitoneValue(): number {
    return 12 * this.octave + this.pitch;
  }
}

enum Interval {
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

const get_interval = (rootNote: Note, relativeNote: Note): Interval => {
  const semitoneDistance: number = Number(relativeNote) - Number(rootNote);
  return semitoneDistance < 0 ? semitoneDistance + 12 : semitoneDistance;
}

class Chord {
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
  }

  toString(): string {
    return this._name;
  }

  addNewInterval(interval: Interval) {
    this._intervals.add(interval);
  }

  fillExtensionNotes(remainingNotes: Map<number, Array<string>>) {
    remainingNotes.forEach((labels, name) => {

    });

    while(remainingNotes.size > 0) {
      const lowestInterval = Math.min(...remainingNotes.keys());
      const labels = remainingNotes.get(lowestInterval) ?? [];
      remainingNotes.delete(lowestInterval);

      switch(labels.length) {
        case(3): // case: b2, 2, #2
          this._name += 'add(b9, 9, #9)';
          break;
        case(2):
          labels.sort((first: string, second: string) => {
            if(first[0] === 'b' || second[0] === '#' || first === '7') return -1;
            if(first[0] === '#' || second[0] === 'b' || first === 'maj7') return 1;
            throw new Error('Invalid labels');
          });
          this._name += `add(${labels[0]}, ${labels[1]})`
          break;
        case(1):
          this._name += labels[0] === 'b' || labels[0] === '#' ? `add(${labels[0]})` : `add${labels[0]}`;
      }
    }
  }

  handleExtensionNotes(isMajorChord: boolean, isPowerChord: boolean = false) {
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

    const extensionNotes: Map<number, Array<string>> = new Map([
      [7, []],
      [9, []],
      [11, []],
      [13, []]
    ]);

    this._intervals.forEach((interval) => {
      const pair: NoteValueNamePair | undefined = nameLookup.get(interval);
      if(pair !== undefined) {
        const { value, name } = pair;
        extensionNotes.set(value, [...(extensionNotes.get(value) ?? []), name])
      }
    });

    console.log(extensionNotes);

    const labels: Array<Array<string>> = Array.from(extensionNotes.values());

    // case: no extension notes or sevenths
    if(!labels.some((label) => label.length > 0)) return;

    // case: seventh(s) present
    const sevenths = extensionNotes.get(7);
    if(sevenths !== undefined) {
      extensionNotes.delete(7);

      if(isPowerChord) this._name += 'add';

      // case: min7 and maj7
      if(sevenths.length === 2) {
        this._name += '(7, maj7)';
        this.fillExtensionNotes(extensionNotes);
      }
    }
  }

  handleSuspendedNotes() {
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

  handleDiminished() {

  }

  handleAugmented() {

  }

  determineChordName(): void {
    const {
      MINOR_SECOND, MAJOR_SECOND,
      MINOR_THIRD, MAJOR_THIRD,
      PERFECT_FOURTH, TRITONE,
      PERFECT_FIFTH,
      MINOR_SIXTH
    } = Interval;

    const isDim: boolean = this._intervals.has(MINOR_THIRD) && this._intervals.has(TRITONE) && !this._intervals.has(PERFECT_FIFTH);
    const isAug: boolean = this._intervals.has(MAJOR_THIRD) && this._intervals.has(MINOR_SIXTH) && !this._intervals.has(PERFECT_FIFTH);

    const hasSecond: boolean = this._intervals.has(MINOR_SECOND) || this._intervals.has(MAJOR_SECOND);
    const hasThird: boolean = this._intervals.has(MINOR_THIRD) || this._intervals.has(MAJOR_THIRD);
    const hasFourth: boolean = this._intervals.has(PERFECT_FOURTH) || this._intervals.has(TRITONE);
    const hasFifth: boolean = this._intervals.has(PERFECT_FIFTH);

    if(this._name.includes('s')) {
      this._name = this._intervals.has(MINOR_THIRD) ? this._name.replace('s', '#') : Interval[this._root.pitch + 1] + 'b';
    }

    if(hasFifth && hasThird) {
      if(this._intervals.has(MINOR_THIRD)) { this._name += 'm'; }

      this.handleExtensionNotes(this._intervals.has(MAJOR_THIRD));
    } else if(hasFifth || this._intervals.has(TRITONE)) {
      const flatFive = this._intervals.delete(TRITONE);

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

        susTwo && this._intervals.add(susTwo);
        susFour && this._intervals.add(susFour);
        this.handleSuspendedNotes();
      } else {
        this._name += '5';
        this.handleExtensionNotes(this._intervals.has(MAJOR_THIRD), true);
      }

      if(flatFive) { this._name += '(b5)'; }
    } else if(hasThird) {
      if(this._intervals.has(MINOR_THIRD) && this._intervals.has(TRITONE)) { // diminished case
        this.handleDiminished();
      } else if(this._intervals.has(MAJOR_THIRD) && this._intervals.has(MINOR_SIXTH)) { // augmented case
        this.handleAugmented();
      } else { // no 5 case
        if(this._intervals.has(MINOR_THIRD)) { this._name += 'm'; }

        this.handleExtensionNotes(this._intervals.has(MAJOR_THIRD));
        this._name += '(no5)'
      }
    } else {
      this.handleExtensionNotes(this._intervals.has(MAJOR_THIRD));
      this._name += '(N/C)';
    }
  }
}

const root = new Note(Pitch.C, 3);
const third = Interval.MAJOR_SECOND;
const fifth = Interval.PERFECT_FIFTH;

const chord = new Chord(root, root);
chord.addNewInterval(third);
chord.addNewInterval(fifth);
chord.determineChordName();
console.log(chord.toString())