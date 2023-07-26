var _vaccineCodeMapping = undefined;

export async function getVaccineCodeMapping() {
  if (_vaccineCodeMapping) return _vaccineCodeMapping;
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/hellodocket/vaccine-code-mappings/main/vaccine-code-mapping.json"
    );
    _vaccineCodeMapping = await response.json();
  } catch (error) {
    console.error("There was a problem fetching vaccine codes", error);
  }
  return _vaccineCodeMapping;
}
