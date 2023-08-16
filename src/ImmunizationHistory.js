import * as futil from "./lib/fhirUtil.js";

import styles from "./ImmunizationHistory.module.css";

function immunizationsByPatient(resources) {
  const groups = resources.reduce((acc, resource) => {
    if (resource.resourceType !== "Immunization") {
      return acc;
    }
    const key = resource.patient.reference;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(resource);
    return acc;
  }, {});

  return Object.values(groups);
}

function renderImmunizationGroup(
  key,
  immunizations,
  organized,
  dcr
) {
  const renderPatient = () => {
    return (
      <tr key={key}>
        <th>Patient</th>
        <td>{futil.renderPerson(immunizations[0].patient, organized.byId)}</td>
      </tr>
    );
  };

  const renderCodings = (codings) => {
    return (
      <ul>
        {codings.map((c, index) => (
          <li key={index}>
            {c.code} ({c.system})
          </li>
        ))}
      </ul>
    );
  };
  const renderPerformers = (performers) => {

	if (!performers) return(undefined);
	
    return (
      <ul>
        {performers.map((p, index) => (
          <li key={index}>{p.actor.display}</li>
        ))}
      </ul>
    );
  };
  const renderImmunization = (immunization, key) => {
    return (
      <tr key={key}>
        <td>{immunization.occurrenceDateTime}</td>
        <td>{futil.renderCodeableJSX(immunization.vaccineCode, dcr)}</td>
        <td>{renderCodings(immunization.vaccineCode.coding)}</td>
        <td>{renderPerformers(immunization.performer)}</td>
        <td>{immunization.lotNumber}</td>
        <td>{immunization.status}</td>
      </tr>
    );
  };

  const renderImmunizations = () => {
    return immunizations
      .sort((a, b) => a.occurrenceDateTime > b.occurrenceDateTime)
      .map((i, index) => renderImmunization(i, index));
  };

  const renderImmunizationHeaders = () => {
    return (
      <tr>
        <th>Date Administered</th>
        <th>Name</th>
        <th>Coding</th>
        <th>Performer</th>
        <th>Lot Number</th>
        <th>Status</th>
      </tr>
    );
  };

  return (
    <table className={styles.dataTable}>
      <tbody>{renderPatient()}</tbody>
      <tbody>{renderImmunizationHeaders()}</tbody>
      <tbody>{renderImmunizations()}</tbody>
    </table>
  );
}

export default function ImmunizationHistory({ organized, dcr }) {
  const immunizationGroups = immunizationsByPatient(
    Object.values(organized.all)
  );
  if (immunizationGroups.length === 0) {
    return;
  }
  return (
    <div className={styles.container}>
      <h2>Immunizations</h2>
      {immunizationGroups.map((ig, index) => (
        <div key={index}>
          {renderImmunizationGroup(index, ig, organized, dcr)}
        </div>
      ))}
    </div>
  );
}
