import { Note, Interval, Chord } from './music';
import { TuningName, guitarTunings, FretNumber, getNoteFromFret } from './fretboard';

export type Frets = [FretNumber|false, FretNumber|false, FretNumber|false, FretNumber|false, FretNumber|false, FretNumber|false]

export const getAllChordsFromNotes = (playedNotes: Array<Note>, bassNote?: Note): Array<string> => {
    if(playedNotes.length === 0) return [];

    (bassNote === undefined) && playedNotes.forEach((note) => {
        if(bassNote === undefined || note.compare(bassNote) === -1) bassNote = note;
    });

    const smallestSemitone = Math.min(...playedNotes.map((note) => note.getSemitoneValue()));
    bassNote = playedNotes.find((note) => note.getSemitoneValue() === smallestSemitone);

    //console.log(playedNotes.map(note => note.toString()))

    const potentialChords: Array<Chord> = [];
    playedNotes.forEach((potentialRoot) => {
        const allIntervals = new Set<Interval>(playedNotes
            .filter((note) => !note.equals(potentialRoot))
            .map((note) => potentialRoot.getInterval(note))
        );

        if(bassNote === undefined) throw new Error('Error: bass note cannot be determined.');
        potentialChords.push(new Chord(potentialRoot, bassNote, allIntervals));
    });

    const sortChordsAsc = (first: Chord, second: Chord) => {
        if(first.prob > second.prob) return -1;
        if(first.prob < second.prob) return 1;
        return 0;
    };

    // this is """machine learning"""
    const probabilityCuttofs = new Map<number, number>([
        [3.8, 3.7],
        [2.9, 2.9],
        [0.9, 0.9],
        [0, 0.1]
    ]);
    let filterConditionCutoff: number | null = null;
    const maxProbability = Math.max(...potentialChords.map((chord) => chord.prob));

    probabilityCuttofs.forEach((filterCuttoff, probCutoff) => {
        if(maxProbability > probCutoff) filterConditionCutoff = filterCuttoff;
    })
    
    // if(maxProbability > 3.8) filterConditionCutoff = 3.7;
    // else if(maxProbability > 2.9) filterConditionCutoff = 2.9;
    // else if(maxProbability > 0.9) filterConditionCutoff = 0.9;
    // else if(maxProbability > 0) filterConditionCutoff = 0.1;
    // else filterConditionCutoff = 0;

    return potentialChords
        .filter((chord) => chord.prob >= (filterConditionCutoff ?? 0))
        .sort(sortChordsAsc)
        .map((chord) => chord.toString())
        .filter((name, idx, newArr) => newArr.indexOf(name) === idx);
}

export const getAllChordsFromFretboard = (tuning: TuningName, pressedFrets: Frets): Array<string> => {
    const openStringNotes = guitarTunings().get(tuning);
    if(openStringNotes === undefined) throw new Error('Error: invalid tuning provided.');
    
    const playedNotes: Array<Note> = [];
    let bassNote: Note | null = null;
    pressedFrets.forEach((fretNumber, index) => {
        if(fretNumber === false) return;

        const currentNote = getNoteFromFret(openStringNotes[index], fretNumber);
        if(bassNote === null || currentNote.compare(bassNote) === -1) bassNote = currentNote;
        playedNotes.push(currentNote);
    });

    return getAllChordsFromNotes(playedNotes);
}

console.log(getAllChordsFromFretboard(TuningName.Standard, [false, 2, 4, 1, false, false]));