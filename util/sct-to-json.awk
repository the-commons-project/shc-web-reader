
# +-----------------+
# | sct-to-json.awk |
# +-----------------+

# Converts the SNOMED Global Patient Set source file into a simple dictionary
# we can use to render codes. Files and license information can be found
# at https://www.snomed.org/gps
#
# Input file is SnomedINTL_GPSRelease_PRODUCTION_20220731T120000Z.txt
# (timestamp portion may be newer over time of course)

BEGIN {
	RS = "\r\n" # input file seems to have MSDOS line breaks
	FS = "\t"
	printf "{"
}

$2 != "1" {
	# skip non-active entries
	next
}

NR > 2 {
	printf ","
}

NR > 1 {
	gsub(/%/, "%%", $4) # escape percents
    gsub(/["\\]/, "\\\\&", $4) # escape quotes and backslashes
	printf "\n  \"" $1 "\": \"" $4 "\"" 
}


END {
	printf "\n}\n"
}
