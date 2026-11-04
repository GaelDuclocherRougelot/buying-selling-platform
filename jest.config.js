module.exports = {
	testEnvironment: "jsdom",
	setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	testPathIgnorePatterns: ["/node_modules/", "/.next/", "/src/__tests__/setup\\.tsx?$"],
	transform: {
		"^.+\\.(ts|tsx)$": [
			"ts-jest",
			{
				tsconfig: {
					jsx: "react-jsx",
				},
			},
		],
	},
};
