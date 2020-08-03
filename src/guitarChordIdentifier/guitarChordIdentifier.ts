import { Pitch, Octave, Note, Interval, Chord } from './music/index.js';
import { TuningName, StringNotes, guitarTunings, FretNumber, getNoteFromFret } from './fretboard/index.js';

export type Frets = [FretNumber|false, FretNumber|false, FretNumber|false, FretNumber|false, FretNumber|false, FretNumber|false]

export const getAllChordsFromNotes = (tuning: TuningName, pressedFrets: Frets): Array<string> => {
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

    if(playedNotes.length === 0) return [];

    playedNotes.forEach(note => console.log(note.toString()));

    const potentialChords: Array<Chord> = [];
    playedNotes.forEach((potentialRoot) => {
        const allIntervals = new Set<Interval>(playedNotes
            .filter((note) => !note.equals(potentialRoot))
            .map((note) => potentialRoot.getInterval(note))
        );

        if(bassNote === null) throw new Error('Error: bass note cannot be determined.');
        potentialChords.push(new Chord(potentialRoot, bassNote, allIntervals));
    });

    return potentialChords
        .sort((first, second) => {
            if(first.prob > second.prob) return 1;
            if(first.prob < second.prob) return -1;
            return 0;
        })
        .map((chord) => chord.toString());
}

console.log(getAllChordsFromNotes(TuningName.Standard, [false, 3, 2, 0, 1, 0]));