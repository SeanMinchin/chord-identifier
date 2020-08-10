import { Note, Interval, Chord, createNoteFromName } from './music';
import { TuningName, guitarTunings, FretNumber, getNoteFromFret, TuningOffset } from './fretboard';

export type Frets = [FretNumber|false, FretNumber|false, FretNumber|false, FretNumber|false, FretNumber|false, FretNumber|false]

export const getAllChordsFromNotes = (playedNotesList: Array<Note | string>, noteInBass: Note | string | null = null): Array<string> => {
    if(playedNotesList.length === 0) return [];

    const playedNotes = playedNotesList.map((note) => typeof note === 'string' ? createNoteFromName(note) : note);

    let bassNote = (typeof noteInBass === 'string') ? createNoteFromName(noteInBass) : noteInBass;
    if(bassNote === null) {
        playedNotes.forEach((note) => {
            if(bassNote === null || note.compare(bassNote) === -1) bassNote = note;
        });
    }

    const potentialChords: Array<Chord> = [];
    playedNotes.forEach((potentialRoot) => {
        const allIntervals = new Set<Interval>(
            playedNotes
                .filter((note) => !note.equals(potentialRoot))
                .map((note) => potentialRoot.getInterval(note))
        );

        if(bassNote === null) throw new Error('Error: bass note cannot be determined.');
        potentialChords.push(new Chord(potentialRoot, bassNote, allIntervals));
    });

    // this is """machine learning"""
    const probabilityCuttofs: Array<number> = [3.8, 2.8, 1.8, 0.8, 0.2];
    let filterConditionCutoff: number | null = null;
    const maxProbability = Math.max(...potentialChords.map((chord) => chord.prob));

    for(const cutoff of probabilityCuttofs) {
        if(maxProbability >= cutoff) {
            filterConditionCutoff = cutoff;
            break;
        }
    }

    const sortChordsAsc = (first: Chord, second: Chord): -1 | 0 | 1 => {
        if(first.prob > second.prob) return -1;
        if(first.prob < second.prob) return 1;
        return 0;
    };

    return potentialChords
        .filter((chord) => chord.prob >= (filterConditionCutoff ?? 0)) // filter through only chords that meet the cutoff probability
        .sort(sortChordsAsc) // sort chords in ascending order of probability
        .map((chord) => chord.toString()) // map to chord names (string format)
        .filter((name, index, chordNameList) => chordNameList.indexOf(name) === index); // filter out duplicate chord names
}

export const getAllChordsFromFretboard = (tuning: TuningName, pressedFrets: Frets, tuningOffset: TuningOffset = 0): Array<string> => {
    const openStringNotes = guitarTunings().get(tuning);
    if(openStringNotes === undefined) throw new Error('Error: invalid tuning provided.');
    
    const playedNotes: Array<Note> = [];
    let bassNote: Note | null = null;
    pressedFrets.forEach((fretNumber, index) => {
        if(fretNumber === false) return;

        const currentNote = getNoteFromFret(openStringNotes[index], fretNumber, tuningOffset);
        if(bassNote === null || currentNote.compare(bassNote) === -1) bassNote = currentNote;
        playedNotes.push(currentNote);
    });

    return getAllChordsFromNotes(playedNotes, bassNote);
}
