import spriteGenerator from '../../../src/view/spriteGenerator';

(async function () {
    const imageElement: HTMLImageElement = <HTMLImageElement>document.getElementById('sprite-sheet')
    const canvas = await spriteGenerator();
    // @ts-ignore convertToBlob
    const blob = await canvas.convertToBlob();
    console.log(blob)
    const objectURL =  URL.createObjectURL(blob);
    imageElement.src = objectURL;
})()

