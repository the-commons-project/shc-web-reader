
# +-----------------+
# | sct-to-json.awk |
# +-----------------+

# Converts the SNOMED CT IPS Terminology file into a simple dictionary
# we can use to render codes. Files and license information can be found
# at https://www.snomed.org/international-patient-summary-terminology.
#
# Input file is sct2_Description_IPSSnapshot-en_IPST_20221130.txt.

BEGIN {
	FS = "\t"
	printf "{"
}

$3 != "1" {
	# skip non-active entries
	next
}

$6 != "en" {
	# skip non-english lines
	next
}

NR > 2 {
	printf ","
}

NR > 1 {
	gsub(/%/, "%%", $8)
	printf "\n  \"" $5 "\": \"" $8 "\"" 
}


END {
	printf "\n}\n"
}
