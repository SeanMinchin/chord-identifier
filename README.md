# Guitar Chord Identifier

This project is a reverse chord identifier, meaning that it's designed to determine all possible chords that could be formed based on a collection of played notes.
The input can either be a list of notes, or the frets played on a guitar fretboard along with that guitar's tuning, and optionally a tuning offset (tuning up or down).
The output is a list of the names of any algorithmically-determined potential chords. The list will be sorted based on the "probability" of each chord being the actual chord, and the list will be reduced to only include the most likely chord or chords.
