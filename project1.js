// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) 
// means the top-left pixels of the foreground and background are aligned.
function composite(bgImg, fgImg, fgOpac, fgPos) {
    let bgData = bgImg.data;
    let fgData = fgImg.data;

    let startX = Math.max(fgPos.x, 0); 
    let startY = Math.max(fgPos.y, 0);
    let endX = Math.min(fgPos.x + fgImg.width, bgImg.width); 
    let endY = Math.min(fgPos.y + fgImg.height, bgImg.height); 

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            let bgIndex = (y * bgImg.width + x) * 4;

            let fgX = x - fgPos.x;
            let fgY = y - fgPos.y;
            let fgIndex = (fgY * fgImg.width + fgX) * 4;

            let fgAlpha = fgData[fgIndex + 3] * fgOpac;
            let alpha = fgAlpha / 255;

            if (fgAlpha > 0) {
                bgData[bgIndex] = alpha * fgData[fgIndex] + (1-alpha) * bgData[bgIndex];       // R
                bgData[bgIndex+1] = alpha * fgData[fgIndex+1] + (1-alpha) * bgData[bgIndex+1]; // G
                bgData[bgIndex+2] = alpha * fgData[fgIndex+2] + (1-alpha) * bgData[bgIndex+2]; // B
                bgData[bgIndex+3] = Math.max(bgData[bgIndex+3], fgAlpha);                      // A
            }
        }
    }
}
