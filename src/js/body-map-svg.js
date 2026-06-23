var BODY_MAP_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 850" preserveAspectRatio="xMidYMid meet">
  <defs>
    <style>
      .bg { fill: #000; }
      .body-base { fill: #161616; stroke: rgba(255,255,255,0.04); stroke-width: 1.5; stroke-linejoin: round; stroke-linecap: round; }
      .muscle { fill: #2A2A35; stroke: rgba(255,255,255,0.08); stroke-width: 1.5; stroke-linejoin: round; stroke-linecap: round; transition: fill 0.25s ease, fill-opacity 0.25s ease; }
      .muscle:hover { cursor: pointer; filter: brightness(1.3); }
      .body-base:hover { cursor: default; }
    </style>
  </defs>
  <rect class="bg" width="600" height="850" />

  <!-- FRONT VIEW -->
  <g id="front-view">
    <path class="body-base" d="M 160,34 C 186,34 196,50 196,68 C 196,82 192,95 188,102 L 248,112 C 267,118 272,136 268,155 L 265,210 C 264,255 263,285 258,305 C 253,318 242,320 235,310 L 233,270 L 225,210 L 218,180 C 220,210 219,250 218,285 L 215,320 L 215,365 C 216,410 216,460 214,510 C 212,560 210,620 207,670 C 205,700 200,720 195,730 L 220,740 L 220,755 L 100,755 L 100,740 L 125,730 C 120,720 115,700 113,670 C 110,620 108,560 106,510 C 104,460 104,410 105,365 L 105,320 L 102,285 C 101,250 100,210 102,180 L 95,210 L 87,270 L 85,310 C 78,320 67,318 62,305 C 57,285 56,255 55,210 L 52,155 C 48,136 53,118 72,112 L 132,102 C 128,95 124,82 124,68 C 124,50 134,34 160,34 Z" />
    <path class="muscle" data-muscle="neck" data-group="Neck" data-side="center" d="M 143,102 C 150,97 170,97 177,102 C 180,114 178,124 175,127 C 165,130 155,130 145,127 C 142,124 140,114 143,102 Z" />
    <path class="muscle" data-muscle="upperChest" data-group="Chest" data-side="center" d="M 125,125 C 142,114 178,114 195,125 C 199,144 196,160 192,167 C 175,173 145,173 128,167 C 124,160 121,144 125,125 Z" />
    <path class="muscle" data-muscle="middleChest" data-group="Chest" data-side="center" d="M 128,162 C 145,154 175,154 192,162 C 196,178 194,194 190,202 C 175,207 145,207 130,202 C 126,194 125,178 128,162 Z" />
    <path class="muscle" data-muscle="lowerChest" data-group="Chest" data-side="center" d="M 130,198 C 145,190 175,190 190,198 C 193,212 191,224 188,230 C 175,234 145,234 132,230 C 129,224 127,212 130,198 Z" />
    <path class="muscle" data-muscle="frontDelts" data-group="Shoulders" data-side="left" d="M 192,127 C 210,122 230,124 242,132 C 245,140 244,152 240,160 C 232,165 220,162 210,156 C 202,150 197,140 192,127 Z" />
    <path class="muscle" data-muscle="frontDelts" data-group="Shoulders" data-side="right" d="M 128,127 C 110,122 90,124 78,132 C 75,140 76,152 80,160 C 88,165 100,162 110,156 C 118,150 123,140 128,127 Z" />
    <path class="muscle" data-muscle="sideDelts" data-group="Shoulders" data-side="left" d="M 240,132 C 252,134 260,146 262,162 C 264,180 258,198 250,206 C 244,210 238,208 235,198 C 233,185 234,168 236,152 C 238,140 240,135 240,132 Z" />
    <path class="muscle" data-muscle="sideDelts" data-group="Shoulders" data-side="right" d="M 80,132 C 68,134 60,146 58,162 C 56,180 62,198 70,206 C 76,210 82,208 85,198 C 87,185 86,168 84,152 C 82,140 80,135 80,132 Z" />
    <path class="muscle" data-muscle="biceps" data-group="Arms" data-side="left" d="M 234,200 C 240,196 246,200 248,212 C 250,228 250,248 248,260 C 246,270 240,272 236,268 C 233,260 232,245 232,230 C 232,218 233,206 234,200 Z" />
    <path class="muscle" data-muscle="biceps" data-group="Arms" data-side="right" d="M 86,200 C 80,196 74,200 72,212 C 70,228 70,248 72,260 C 74,270 80,272 84,268 C 87,260 88,245 88,230 C 88,218 87,206 86,200 Z" />
    <path class="muscle" data-muscle="forearms" data-group="Arms" data-side="left" d="M 236,265 C 242,261 248,266 250,278 C 252,296 250,316 246,328 C 242,338 236,340 232,335 C 230,325 230,308 230,292 C 230,278 232,270 236,265 Z" />
    <path class="muscle" data-muscle="forearms" data-group="Arms" data-side="right" d="M 84,265 C 78,261 72,266 70,278 C 68,296 70,316 74,328 C 78,338 84,340 88,335 C 90,325 90,308 90,292 C 90,278 88,270 84,265 Z" />
    <path class="muscle" data-muscle="upperAbs" data-group="Core" data-side="center" d="M 144,232 C 150,227 170,227 176,232 C 179,246 178,264 176,274 C 170,278 150,278 144,274 C 142,264 141,246 144,232 Z" />
    <path class="muscle" data-muscle="lowerAbs" data-group="Core" data-side="center" d="M 144,274 C 150,270 170,270 176,274 C 179,288 178,302 176,308 C 170,312 150,312 144,308 C 142,302 141,288 144,274 Z" />
    <path class="muscle" data-muscle="obliques" data-group="Core" data-side="left" d="M 174,232 C 184,235 190,246 190,262 C 190,280 188,296 184,306 C 180,312 176,312 174,306 C 172,294 172,275 172,260 C 172,246 173,236 174,232 Z" />
    <path class="muscle" data-muscle="obliques" data-group="Core" data-side="right" d="M 146,232 C 136,235 130,246 130,262 C 130,280 132,296 136,306 C 140,312 144,312 146,306 C 148,294 148,275 148,260 C 148,246 147,236 146,232 Z" />
    <path class="muscle" data-muscle="hipFlexors" data-group="Hips" data-side="center" d="M 148,308 C 154,304 166,304 172,308 C 176,316 175,326 172,330 C 166,334 154,334 148,330 C 145,326 144,316 148,308 Z" />
    <path class="muscle" data-muscle="quads" data-group="Legs" data-side="left" d="M 155,330 C 160,326 168,326 172,330 C 176,340 178,360 178,380 C 178,410 177,445 175,475 C 173,492 168,498 162,496 C 158,492 156,482 156,468 C 156,445 155,415 154,388 C 153,362 155,345 155,330 Z" />
    <path class="muscle" data-muscle="quads" data-group="Legs" data-side="right" d="M 145,330 C 140,326 132,326 128,330 C 124,340 122,360 122,380 C 122,410 123,445 125,475 C 127,492 132,498 138,496 C 142,492 144,482 144,468 C 144,445 145,415 146,388 C 147,362 145,345 145,330 Z" />
    <path class="muscle" data-muscle="innerThighs" data-group="Legs" data-side="center" d="M 148,340 C 152,362 155,395 156,430 C 157,465 155,490 152,502 C 148,508 144,506 142,498 C 140,488 140,470 142,448 C 144,420 146,388 147,358 C 147,348 148,342 148,340 Z M 172,340 C 168,362 165,395 164,430 C 163,465 165,490 168,502 C 172,508 176,506 178,498 C 180,488 180,470 178,448 C 176,420 174,388 173,358 C 173,348 172,342 172,340 Z" />
    <path class="muscle" data-muscle="calves" data-group="Legs" data-side="center" d="M 152,505 C 158,512 164,530 166,555 C 168,582 166,610 162,630 C 158,644 152,646 148,640 C 145,632 144,618 144,600 C 144,575 146,545 149,520 C 150,510 151,505 152,505 Z M 168,505 C 162,512 156,530 154,555 C 152,582 154,610 158,630 C 162,644 168,646 172,640 C 175,632 176,618 176,600 C 176,575 174,545 171,520 C 170,510 169,505 168,505 Z" />
    <path class="muscle" data-muscle="tibialis" data-group="Legs" data-side="center" d="M 156,510 C 160,518 163,540 164,565 C 165,590 163,615 160,635 C 156,644 152,644 148,638 C 146,630 145,615 145,600 C 145,575 147,545 150,522 C 152,514 154,510 156,510 Z M 164,510 C 160,518 157,540 156,565 C 155,590 157,615 160,635 C 164,644 168,644 172,638 C 174,630 175,615 175,600 C 175,575 173,545 170,522 C 168,514 166,510 164,510 Z" />
  </g>

  <!-- BACK VIEW -->
  <g id="back-view">
    <path class="body-base" d="M 440,34 C 466,34 476,50 476,68 C 476,82 472,95 468,102 L 528,112 C 547,118 552,136 548,155 L 545,210 C 544,255 543,285 538,305 C 533,318 522,320 515,310 L 513,270 L 505,210 L 498,180 C 500,210 499,250 498,285 L 495,320 L 495,365 C 496,410 496,460 494,510 C 492,560 490,620 487,670 C 485,700 480,720 475,730 L 500,740 L 500,755 L 380,755 L 380,740 L 405,730 C 400,720 395,700 393,670 C 390,620 388,560 386,510 C 384,460 384,410 385,365 L 385,320 L 382,285 C 381,250 380,210 382,180 L 375,210 L 367,270 L 365,310 C 358,320 347,318 342,305 C 337,285 336,255 335,210 L 332,155 C 328,136 333,118 352,112 L 412,102 C 408,95 404,82 404,68 C 404,50 414,34 440,34 Z" />
    <path class="muscle" data-muscle="upperTraps" data-group="Back" data-side="center" d="M 420,105 C 435,99 445,99 460,105 C 472,113 486,122 496,130 C 502,138 496,146 480,150 C 458,154 422,154 400,150 C 384,146 378,138 384,130 C 394,122 408,113 420,105 Z" />
    <path class="muscle" data-muscle="middleTraps" data-group="Back" data-side="center" d="M 405,142 C 425,134 455,134 475,142 C 486,150 488,164 484,178 C 476,187 454,192 440,193 C 426,192 404,187 396,178 C 392,164 394,150 405,142 Z" />
    <path class="muscle" data-muscle="lowerTraps" data-group="Back" data-side="center" d="M 406,182 C 422,173 458,173 474,182 C 482,193 484,208 478,220 C 470,228 454,233 440,234 C 426,233 410,228 402,220 C 396,208 398,193 406,182 Z" />
    <path class="muscle" data-muscle="rearDelts" data-group="Shoulders" data-side="right" d="M 404,132 C 390,128 376,133 366,144 C 360,156 360,170 366,180 C 372,187 384,190 392,185 C 400,178 404,164 406,150 C 407,140 406,135 404,132 Z" />
    <path class="muscle" data-muscle="rearDelts" data-group="Shoulders" data-side="left" d="M 476,132 C 490,128 504,133 514,144 C 520,156 520,170 514,180 C 508,187 496,190 488,185 C 480,178 476,164 474,150 C 473,140 474,135 476,132 Z" />
    <path class="muscle" data-muscle="lats" data-group="Back" data-side="right" d="M 400,152 C 386,158 374,176 370,202 C 366,232 368,258 372,278 C 376,294 382,298 390,295 C 395,288 398,268 398,246 C 398,218 396,190 400,174 C 404,160 406,152 400,152 Z" />
    <path class="muscle" data-muscle="lats" data-group="Back" data-side="left" d="M 480,152 C 494,158 506,176 510,202 C 514,232 512,258 508,278 C 504,294 498,298 490,295 C 485,288 482,268 482,246 C 482,218 484,190 480,174 C 476,160 474,152 480,152 Z" />
    <path class="muscle" data-muscle="midBack" data-group="Back" data-side="center" d="M 426,142 C 434,137 446,137 454,142 C 462,152 464,168 462,186 C 458,200 450,205 440,205 C 430,205 422,200 418,186 C 416,168 419,152 426,142 Z" />
    <path class="muscle" data-muscle="lowerBack" data-group="Back" data-side="center" d="M 428,220 C 436,214 444,214 452,220 C 460,235 462,258 460,278 C 456,296 448,304 440,306 C 432,304 424,296 420,278 C 418,258 421,235 428,220 Z" />
    <path class="muscle" data-muscle="triceps" data-group="Arms" data-side="right" d="M 345,168 C 338,164 330,172 328,186 C 325,204 328,222 330,234 C 334,244 340,248 346,244 C 350,236 350,220 350,204 C 350,188 348,174 345,168 Z" />
    <path class="muscle" data-muscle="triceps" data-group="Arms" data-side="left" d="M 520,168 C 527,164 535,172 537,186 C 540,204 537,222 535,234 C 531,244 525,248 519,244 C 515,236 515,220 515,204 C 515,188 517,174 520,168 Z" />
    <path class="muscle" data-muscle="forearmsBack" data-group="Arms" data-side="right" d="M 348,237 C 340,232 333,238 330,250 C 328,268 328,286 330,300 C 333,310 340,314 346,308 C 350,300 350,282 350,264 C 350,252 350,244 348,237 Z" />
    <path class="muscle" data-muscle="forearmsBack" data-group="Arms" data-side="left" d="M 518,237 C 525,232 532,238 535,250 C 537,268 537,286 535,300 C 532,310 525,314 519,308 C 515,300 515,282 515,264 C 515,252 515,244 518,237 Z" />
    <path class="muscle" data-muscle="glutes" data-group="Legs" data-side="center" d="M 405,306 C 425,296 455,296 475,306 C 484,318 486,334 482,346 C 472,354 450,358 440,358 C 430,358 408,354 398,346 C 394,334 396,318 405,306 Z" />
    <path class="muscle" data-muscle="hamstrings" data-group="Legs" data-side="right" d="M 405,350 C 396,356 386,372 382,396 C 378,428 380,464 384,498 C 387,514 394,518 400,514 C 405,506 407,490 406,468 C 404,438 404,400 402,376 C 401,360 404,352 405,350 Z" />
    <path class="muscle" data-muscle="hamstrings" data-group="Legs" data-side="left" d="M 462,350 C 471,356 481,372 485,396 C 489,428 487,464 483,498 C 480,514 473,518 467,514 C 462,506 460,490 461,468 C 463,438 463,400 465,376 C 466,360 463,352 462,350 Z" />
    <path class="muscle" data-muscle="calvesBack" data-group="Legs" data-side="right" d="M 408,518 C 400,528 394,552 392,580 C 390,610 394,636 398,650 C 403,660 410,662 416,656 C 420,648 422,632 422,612 C 422,585 420,550 417,532 C 415,524 412,518 408,518 Z" />
    <path class="muscle" data-muscle="calvesBack" data-group="Legs" data-side="left" d="M 468,518 C 476,528 482,552 484,580 C 486,610 482,636 478,650 C 473,660 466,662 460,656 C 456,648 454,632 454,612 C 454,585 456,550 459,532 C 461,524 464,518 468,518 Z" />
  </g>
</svg>
`;
