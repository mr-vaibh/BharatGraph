export function highlightMatches(text: string, matches: { indices: [number, number][] }[] = []) {
    const matchedIndexes = new Set<number>()
    matches.forEach(({ indices }) => {
        indices.forEach(([start, end]: [number, number]) => {
            for (let i = start; i <= end; i++) matchedIndexes.add(i)
        })
    })

    return (
        <>
            {text.split('').map((char, idx) =>
                matchedIndexes.has(idx) ? <b key={`${char}-${idx}`}>{char}</b> : char
            )}
        </>
    )
}