		/* ------------------------------------------------------------------ *
		 * Skins                                                              *
		 * ------------------------------------------------------------------ */

        /** Ground stays stationary. Two broad compositor color fields and five
         * fixed-size lights share the scene budget. Near anchors feed the light
         * planner; their legacy dimensions are not additional rendered circles.
         * Rich wallpapers and readable glass surfaces have separate roles.
         */
        // Shared scene data is allocated once, independent of theme selection.
        const SCENE_LIGHT_ANCHORS = [
            [272, 90, 86, .36], [232, 6, 44, .24], [190, 12, 16, .48],
            [164, 82, 12, .42], [150, 57, 66, .28], [132, 34, 83, .32],
            [108, 46, 8, .40], [96, 25, 47, .34], [88, 71, 41, .36],
            [76, 93, 58, .32], [68, 64, 92, .36], [58, 8, 74, .34],
        ]
        const SCENE_FIELD_ANCHORS = [
            [880, 640, 6, -6, .34], [760, 560, 96, 30, .30],
            [680, 520, 44, 106, .26],
        ]
        const chromaticScene = (tint, base, stops, colors) => ({
            tint, base,
            swatch: `linear-gradient(140deg, rgb(${colors[1]}), ${stops[1]} 52%, ${base})`,
            ground: `linear-gradient(118deg,transparent 8%,rgba(${colors[1]},.13) 24%,transparent 36%),radial-gradient(126% 108% at 50% 44%,transparent 48%,rgba(0,0,0,.52) 100%),linear-gradient(160deg,${stops[0]} 0%,${stops[1]} 26%,${stops[2]} 54%,${stops[3]} 78%,${base} 100%)`,
            far: SCENE_FIELD_ANCHORS.map(([w, h, x, y, a], i) =>
                `radial-gradient(${w}px ${h}px at ${x}% ${y}%,rgba(${colors[i % colors.length]},${a}),rgba(${colors[i % colors.length]},0) 64%)`
            ).join(','),
            near: SCENE_LIGHT_ANCHORS.map(([r, x, y, a], i) =>
                `radial-gradient(circle ${r}px at ${x}% ${y}%,rgba(${colors[i % colors.length]},${a}) 0 40%,rgba(${colors[i % colors.length]},0) 76%)`
            ).join(','),
        })
		const SKINS = [
			{
				id: 'off',
				swatch: 'linear-gradient(140deg, #1b1b1c, #101012)',
			},
			{
				id: 'aero',
				tint: '212 60% 11%',
				swatch: 'linear-gradient(140deg, #2f8fe0, #0a2b52 55%, #061423)',
				ground: [
					'linear-gradient(112deg, rgba(255,255,255,0) 6%, rgba(198,238,255,.15) 21%, rgba(255,255,255,0) 33%)',
					'linear-gradient(112deg, rgba(255,255,255,0) 51%, rgba(198,238,255,.11) 63%, rgba(255,255,255,0) 75%)',
					'radial-gradient(128% 110% at 48% 42%, rgba(0,0,0,0) 46%, rgba(0,0,0,.50) 100%)',
					'linear-gradient(158deg, #15518b 0%, #104474 24%, #092e53 52%, #061d35 76%, #04192e 100%)',
				].join(','),
				far: [
					'radial-gradient(940px 680px at 2% -8%, rgba(54,120,192,.52), rgba(54,120,192,0) 62%)',
					'radial-gradient(640px 480px at 104% 30%, rgba(34,150,180,.20), rgba(34,150,180,0) 66%)',
					'radial-gradient(720px 560px at 58% 108%, rgba(48,109,208,.30), rgba(48,109,208,0) 64%)',
					'radial-gradient(520px 420px at 76% -6%, rgba(64,132,208,.24), rgba(64,132,208,0) 62%)',
				].join(','),
				near: [
					'radial-gradient(circle 268px at 88% 88%, rgba(96,150,255,.34) 0 42%, rgba(96,150,255,0) 78%)',
					'radial-gradient(circle 224px at 7% 47%, rgba(120,200,255,.26) 0 40%, rgba(120,200,255,0) 76%)',
					'radial-gradient(circle 176px at 16% 21%, rgba(150,226,255,.52) 0 40%, rgba(150,226,255,0) 76%)',
					'radial-gradient(circle 168px at 93% 23%, rgba(78,240,222,.34) 0 40%, rgba(78,240,222,0) 76%)',
					'radial-gradient(circle 158px at 62% 11%, rgba(120,205,255,.32) 0 40%, rgba(120,205,255,0) 76%)',
					'radial-gradient(circle 142px at 43% 73%, rgba(150,190,255,.28) 0 42%, rgba(150,190,255,0) 78%)',
					'radial-gradient(circle 104px at 30% 9%, rgba(216,248,255,.56) 0 38%, rgba(216,248,255,0) 74%)',
					'radial-gradient(circle 96px at 78% 76%, rgba(116,216,250,.36) 0 40%, rgba(116,216,250,0) 76%)',
					'radial-gradient(circle 92px at 5% 66%, rgba(130,215,255,.48) 0 40%, rgba(130,215,255,0) 76%)',
					'radial-gradient(circle 84px at 34% 35%, rgba(190,235,255,.38) 0 38%, rgba(190,235,255,0) 74%)',
					'radial-gradient(circle 72px at 69% 51%, rgba(170,220,255,.34) 0 38%, rgba(170,220,255,0) 74%)',
					'radial-gradient(circle 64px at 52% 89%, rgba(140,225,255,.42) 0 36%, rgba(140,225,255,0) 72%)',
				].join(','),
				base: '#04101d',
			},
			{
				id: 'aurora',
				tint: '258 42% 12%',
				swatch: 'linear-gradient(140deg, #57e6d2, #3b3f9e 52%, #150f2e)',
				ground: [
					'linear-gradient(118deg, rgba(255,255,255,0) 8%, rgba(214,240,255,.13) 24%, rgba(255,255,255,0) 36%)',
					'radial-gradient(126% 108% at 50% 44%, rgba(0,0,0,0) 48%, rgba(0,0,0,.52) 100%)',
					'linear-gradient(160deg, #1b4f6e 0%, #23407a 26%, #26265c 54%, #151238 78%, #0a0a1c 100%)',
				].join(','),
				far: [
					'radial-gradient(880px 640px at 6% -6%, rgba(96,214,255,.34), rgba(96,214,255,0) 62%)',
					'radial-gradient(760px 560px at 96% 30%, rgba(170,120,255,.30), rgba(170,120,255,0) 66%)',
					'radial-gradient(680px 520px at 44% 106%, rgba(110,120,255,.26), rgba(110,120,255,0) 64%)',
				].join(','),
				near: [
					'radial-gradient(circle 272px at 90% 86%, rgba(108,132,255,.36) 0 42%, rgba(108,132,255,0) 78%)',
					'radial-gradient(circle 232px at 6% 44%, rgba(120,140,255,.24) 0 40%, rgba(120,140,255,0) 76%)',
					'radial-gradient(circle 190px at 12% 16%, rgba(94,240,214,.48) 0 40%, rgba(94,240,214,0) 76%)',
					'radial-gradient(circle 164px at 82% 12%, rgba(178,150,255,.42) 0 40%, rgba(178,150,255,0) 76%)',
					'radial-gradient(circle 150px at 57% 66%, rgba(140,160,255,.28) 0 42%, rgba(140,160,255,0) 78%)',
					'radial-gradient(circle 132px at 34% 83%, rgba(120,236,255,.32) 0 42%, rgba(120,236,255,0) 78%)',
					'radial-gradient(circle 108px at 46% 8%, rgba(180,225,255,.40) 0 38%, rgba(180,225,255,0) 74%)',
					'radial-gradient(circle 96px at 25% 47%, rgba(150,240,225,.34) 0 38%, rgba(150,240,225,0) 74%)',
					'radial-gradient(circle 88px at 71% 41%, rgba(196,170,255,.36) 0 38%, rgba(196,170,255,0) 74%)',
					'radial-gradient(circle 76px at 93% 58%, rgba(150,190,255,.32) 0 38%, rgba(150,190,255,0) 74%)',
					'radial-gradient(circle 68px at 64% 92%, rgba(120,225,245,.36) 0 36%, rgba(120,225,245,0) 72%)',
					'radial-gradient(circle 58px at 8% 74%, rgba(190,215,255,.34) 0 36%, rgba(190,215,255,0) 72%)',
				].join(','),
				base: '#0a0a1c',
			},
			{
				id: 'graphite',
				tint: '220 9% 10%',
				swatch: 'linear-gradient(140deg, #616b78, #262b32 55%, #14161a)',
				ground: [
					'linear-gradient(114deg, rgba(255,255,255,0) 8%, rgba(226,238,252,.09) 24%, rgba(255,255,255,0) 36%)',
					'radial-gradient(126% 108% at 50% 44%, rgba(0,0,0,0) 46%, rgba(0,0,0,.54) 100%)',
					'linear-gradient(160deg, #292f38 0%, #1e242c 28%, #151a21 56%, #14171c 80%, #0b0d10 100%)',
				].join(','),
				far: [
					'radial-gradient(900px 660px at 4% -8%, rgba(108,124,146,.20), rgba(108,124,146,0) 64%)',
					'radial-gradient(640px 500px at 72% 104%, rgba(90,109,135,.15), rgba(90,109,135,0) 62%)',
				].join(','),
				near: [
					'radial-gradient(circle 268px at 88% 88%, rgba(150,168,190,.18) 0 42%, rgba(150,168,190,0) 78%)',
					'radial-gradient(circle 214px at 8% 50%, rgba(170,190,214,.15) 0 40%, rgba(170,190,214,0) 76%)',
					'radial-gradient(circle 196px at 14% 18%, rgba(196,214,232,.26) 0 40%, rgba(196,214,232,0) 78%)',
					'radial-gradient(circle 158px at 86% 20%, rgba(150,168,190,.20) 0 42%, rgba(150,168,190,0) 78%)',
					'radial-gradient(circle 132px at 58% 62%, rgba(186,202,222,.16) 0 42%, rgba(186,202,222,0) 78%)',
					'radial-gradient(circle 104px at 36% 78%, rgba(206,222,240,.20) 0 38%, rgba(206,222,240,0) 74%)',
					'radial-gradient(circle 88px at 44% 10%, rgba(224,236,250,.24) 0 38%, rgba(224,236,250,0) 74%)',
					'radial-gradient(circle 74px at 70% 46%, rgba(198,214,234,.20) 0 38%, rgba(198,214,234,0) 74%)',
					'radial-gradient(circle 60px at 92% 60%, rgba(214,228,244,.20) 0 36%, rgba(214,228,244,0) 72%)',
					'radial-gradient(circle 52px at 22% 40%, rgba(226,238,252,.20) 0 36%, rgba(226,238,252,0) 72%)',
				].join(','),
				base: '#0b0d10',
			},
			{
				id: 'phoenix',
				tint: '4 76% 12%',
				swatch: 'linear-gradient(140deg, #ffe15c, #ed2534 54%, #641126)',
				ground: [
					'linear-gradient(118deg, rgba(255,255,255,0) 8%, rgba(255,205,48,.13) 24%, rgba(255,255,255,0) 36%)',
					'radial-gradient(126% 108% at 50% 44%, rgba(0,0,0,0) 48%, rgba(0,0,0,.52) 100%)',
					'linear-gradient(160deg, #b81228 0%, #a20d35 26%, #8c1232 54%, #5a1230 78%, #320c22 100%)',
				].join(','),
				far: [
					'radial-gradient(880px 640px at 6% -6%, rgba(255,54,48,.34), rgba(255,54,48,0) 62%)',
					'radial-gradient(760px 560px at 96% 30%, rgba(255,223,80,.30), rgba(255,223,80,0) 66%)',
					'radial-gradient(680px 520px at 44% 106%, rgba(248,62,63,.26), rgba(248,62,63,0) 64%)',
				].join(','),
				near: [
					'radial-gradient(circle 272px at 90% 86%, rgba(255,108,48,.36) 0 42%, rgba(255,108,48,0) 78%)',
					'radial-gradient(circle 232px at 6% 44%, rgba(255,229,108,.24) 0 40%, rgba(255,229,108,0) 76%)',
					'radial-gradient(circle 190px at 12% 16%, rgba(255,66,51,.48) 0 40%, rgba(255,66,51,0) 76%)',
					'radial-gradient(circle 164px at 82% 12%, rgba(255,205,48,.42) 0 40%, rgba(255,205,48,0) 76%)',
					'radial-gradient(circle 150px at 57% 66%, rgba(255,54,48,.28) 0 42%, rgba(255,54,48,0) 78%)',
					'radial-gradient(circle 132px at 34% 83%, rgba(255,223,80,.32) 0 42%, rgba(255,223,80,0) 78%)',
					'radial-gradient(circle 108px at 46% 8%, rgba(248,62,63,.40) 0 38%, rgba(248,62,63,0) 74%)',
					'radial-gradient(circle 96px at 25% 47%, rgba(255,108,48,.34) 0 38%, rgba(255,108,48,0) 74%)',
					'radial-gradient(circle 88px at 71% 41%, rgba(255,229,108,.36) 0 38%, rgba(255,229,108,0) 74%)',
					'radial-gradient(circle 76px at 93% 58%, rgba(255,66,51,.32) 0 38%, rgba(255,66,51,0) 74%)',
					'radial-gradient(circle 68px at 64% 92%, rgba(255,205,48,.36) 0 36%, rgba(255,205,48,0) 72%)',
					'radial-gradient(circle 58px at 8% 74%, rgba(255,54,48,.34) 0 36%, rgba(255,54,48,0) 72%)',
				].join(','),
				base: '#320c22',
			},
			{
				id: 'jade',
				tint: '136 64% 11%',
				swatch: 'linear-gradient(140deg, #b0ed85, #329f45 52%, #104326)',
				ground: [
					'linear-gradient(118deg, rgba(255,255,255,0) 8%, rgba(107,232,113,.13) 24%, rgba(255,255,255,0) 36%)',
					'radial-gradient(126% 108% at 50% 44%, rgba(0,0,0,0) 48%, rgba(0,0,0,.52) 100%)',
					'linear-gradient(160deg, #16471f 0%, #124b25 26%, #104128 54%, #0a2f1d 78%, #08291a 100%)',
				].join(','),
				far: [
					'radial-gradient(880px 640px at 6% -6%, rgba(54,204,87,.34), rgba(54,204,87,0) 62%)',
					'radial-gradient(760px 560px at 96% 30%, rgba(82,207,108,.30), rgba(82,207,108,0) 66%)',
					'radial-gradient(680px 520px at 44% 106%, rgba(49,184,85,.26), rgba(49,184,85,0) 64%)',
				].join(','),
				near: [
					'radial-gradient(circle 272px at 90% 86%, rgba(127,234,96,.36) 0 42%, rgba(127,234,96,0) 78%)',
					'radial-gradient(circle 232px at 6% 44%, rgba(75,213,108,.24) 0 40%, rgba(75,213,108,0) 76%)',
					'radial-gradient(circle 190px at 12% 16%, rgba(153,240,135,.48) 0 40%, rgba(153,240,135,0) 76%)',
					'radial-gradient(circle 164px at 82% 12%, rgba(107,232,113,.42) 0 40%, rgba(107,232,113,0) 76%)',
					'radial-gradient(circle 150px at 57% 66%, rgba(54,204,87,.28) 0 42%, rgba(54,204,87,0) 78%)',
					'radial-gradient(circle 132px at 34% 83%, rgba(138,236,156,.32) 0 42%, rgba(138,236,156,0) 78%)',
					'radial-gradient(circle 108px at 46% 8%, rgba(88,224,116,.40) 0 38%, rgba(88,224,116,0) 74%)',
					'radial-gradient(circle 96px at 25% 47%, rgba(127,234,96,.34) 0 38%, rgba(127,234,96,0) 74%)',
					'radial-gradient(circle 88px at 71% 41%, rgba(75,213,108,.36) 0 38%, rgba(75,213,108,0) 74%)',
					'radial-gradient(circle 76px at 93% 58%, rgba(153,240,135,.32) 0 38%, rgba(153,240,135,0) 74%)',
					'radial-gradient(circle 68px at 64% 92%, rgba(107,232,113,.36) 0 36%, rgba(107,232,113,0) 72%)',
					'radial-gradient(circle 58px at 8% 74%, rgba(54,204,87,.34) 0 36%, rgba(54,204,87,0) 72%)',
				].join(','),
				base: '#08291a',
			},
            {id: 'flame', ...chromaticScene(
                '12 76% 12%', '#541608',
                ['#c94312', '#ae3210', '#91280d', '#721f0a'],
                ['255,77,38', '255,224,75', '255,143,36'],
            )},
			{id: 'teal', ...chromaticScene(
                '174 58% 10%', '#07252a',
                ['#146779', '#176353', '#104952', '#0a323c'],
                ['48,215,193', '230,193,103', '86,181,238'],
            )},
			{id: 'rose', ...chromaticScene(
                '337 46% 12%', '#2d1024',
                ['#853758', '#6b3053', '#502642', '#381c32'],
                ['249,117,164', '255,192,174', '184,122,190'],
            )},
			{id: 'amber', ...chromaticScene(
                '28 62% 10%', '#2a1308',
                ['#8a481c', '#703819', '#582c17', '#3b2112'],
                ['255,174,56', '255,223,155', '233,116,55'],
            )},
		]

