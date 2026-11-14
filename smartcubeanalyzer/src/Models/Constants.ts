import { Option, OptionGroup } from "./Types";
import { CrossColor, MethodName, OllEdgeOrientation, PllCornerPermutation, StepName } from "./Types";

/**
 * Buckets cases into dropdown sub-menus using the same classification map that drives the
 * OLL/PLL category charts, so the two can never disagree about which case sits where.
 */
function groupCases<T extends string>(cases: Option[], mapping: Map<string, T>, order: [T, string][]): OptionGroup[] {
    return order.map(([key, label]) => ({ label, options: cases.filter(c => mapping.get(c.value) === key) }));
}

function classifyCases<T extends string>(cases: Option[], groups: [T, string][]): Map<string, T> {
    const categories = new Map(groups.flatMap(([category, values]) =>
        values.split(' ').map(value => [value, category] as const)));
    return new Map(cases.map(({ value }) => [value, categories.get(value)!]));
}

export class Const {
    static readonly StdDevWindow: number = 1000; // This is the default window to use when calculating a single standard deviation
    static readonly InspectionGraphChunks: number = 7;
    static readonly DefaultWindowSize: number = 1000;
    static readonly FastestSolvesCount: number = 100;

    static readonly MethodSteps: { [id in MethodName]: StepName[] } = {
        [MethodName.CFOP]: [StepName.Cross, StepName.F2L_1, StepName.F2L_2, StepName.F2L_3, StepName.F2L_4, StepName.OLL, StepName.PLL],
        [MethodName.CFOP_4LL]: [StepName.Cross, StepName.F2L_1, StepName.F2L_2, StepName.F2L_3, StepName.F2L_4, StepName.EOLL, StepName.COLL, StepName.CPLL, StepName.EPLL],
        [MethodName.CFOP_2OLL]: [StepName.Cross, StepName.F2L_1, StepName.F2L_2, StepName.F2L_3, StepName.F2L_4, StepName.EOLL, StepName.COLL, StepName.PLL],
        [MethodName.Roux]: [StepName.LEFTBLOCK, StepName.RIGHTBLOCK, StepName.CMLL, StepName.LSE],
        [MethodName.ZZ]: [StepName.EOLINE, StepName.F2L, StepName.ZBLL],
        [MethodName.LayerByLayer]: [StepName.Cross, StepName.F2L, StepName.EOLL, StepName.COLL, StepName.CPLL, StepName.EPLL]
    }

    static readonly PllCases: Option[] = 'Solved T V Aa Ab Ga Gb Gc Gd Ja Jb F Y Ua Ub Ra Rb Na Nb H E Z'
        .split(' ').map(value => ({ label: value === 'Solved' ? value : `${value} Perm`, value }));

    static readonly PllCornerPermutationMapping = classifyCases(Const.PllCases, [
        [PllCornerPermutation.Solved, 'Solved Ua Ub H Z'],
        [PllCornerPermutation.Adjacent, 'T Aa Ab Ga Gb Gc Gd Ja Jb F Ra Rb'],
        [PllCornerPermutation.Diagonal, 'V Y Na Nb E'],
    ]);

    static readonly OllCases: Option[] = ['Solved', ...Array.from({ length: 57 }, (_, i) => String(i + 1))]
        .map(value => ({ label: value, value }));

    static readonly OllEdgeOrientationMapping = classifyCases(Const.OllCases, [
        [OllEdgeOrientation.Dot, '1 2 3 4 17 18 19 20'],
        [OllEdgeOrientation.Line, '13 14 15 16 33 34 39 40 45 46 51 52 55 56 57'],
        [OllEdgeOrientation.Angle, '5 6 7 8 9 10 11 12 28 29 30 31 32 35 36 37 38 41 42 43 44 47 48 49 50 53 54'],
        [OllEdgeOrientation.Cross, 'Solved 21 22 23 24 25 26 27'],
    ]);

    /** PLL sub-menus, ordered by how scrambled the corners are. */
    static readonly PllGroups: OptionGroup[] = groupCases(Const.PllCases, Const.PllCornerPermutationMapping, [
        [PllCornerPermutation.Adjacent, "Corners Swapped Adjacent"],
        [PllCornerPermutation.Diagonal, "Corners Swapped Diagonally"],
        [PllCornerPermutation.Solved, "Corners Solved"]
    ]);

    /** OLL sub-menus, ordered by the edge-orientation shape on the last layer. */
    static readonly OllGroups: OptionGroup[] = groupCases(Const.OllCases, Const.OllEdgeOrientationMapping, [
        [OllEdgeOrientation.Dot, "Dot Cases"],
        [OllEdgeOrientation.Line, "Line Cases"],
        [OllEdgeOrientation.Angle, "Angle Cases"],
        [OllEdgeOrientation.Cross, "Cross Cases"]
    ]);

    static readonly crossMappings = new Map<string, CrossColor>(
        [
            // CFOP
            ['DB', CrossColor.White],
            ['BU', CrossColor.Green],
            ['FU', CrossColor.Blue],
            ['UF', CrossColor.Yellow],
            ['LU', CrossColor.Red],
            ['RU', CrossColor.Orange],

            // Roux
            ...'BD BL BR DF DL DR FD FL FR LB LD LF RB RD RF UB UL UR'.split(' ')
                .map(rotation => [rotation, CrossColor.Unknown] as [string, CrossColor])
        ]
    );

    static readonly solveCleanliness: Option[] = [
        { label: "Clean", value: "Clean" },
        { label: "Mistake", value: "Mistake" }
    ]

    static readonly solveLuckiness: Option[] = [
        { label: "FullStep", value: "FullStep" },
        { label: "Skip", value: "Skip" }
    ]
}