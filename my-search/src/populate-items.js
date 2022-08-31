export default function populateSuggestions(table) {
	return table.set({
		"cpe": {
			templateUrl: "https://dictionary.cambridge.org/us/dictionary/portuguese-english/$",
			textSlot: "$",
			spaceReplacement: "-",
		},
		"cep": {
			templateUrl: "https://dictionary.cambridge.org/us/dictionary/english-portuguese/$",
			textSlot: "$",
			spaceReplacement: "-",
		},
		"ce": {
			templateUrl: "https://dictionary.cambridge.org/us/dictionary/english/$",
			textSlot: "$",
			spaceReplacement: "-",
		},
		"tep": {
			templateUrl: "https://translate.google.com.br/?sl=en&tl=pt&text=$&op=translate",
			textSlot: "$",
			spaceReplacement: " ",
		},
		"tpe": {
			templateUrl: "https://translate.google.com.br/?sl=pt&tl=en&text=$&op=translate",
			textSlot: "$",
			spaceReplacement: " ",
		},
		"id": {
			templateUrl: "https://idioms.thefreedictionary.com/$",
			textSlot: "$",
			spaceReplacement: "-",
		},
		"ox": {
			templateUrl: "https://www.oxfordlearnersdictionaries.com/us/definition/english/$",
			textSlot: "$",
			spaceReplacement: "-",
		},
	});
}
