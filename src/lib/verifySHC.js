
import { verify, Directory } from 'smart-health-card-decoder'

var _verifyDir = undefined;

export default async function verifySHC(shc) {

  if (!_verifyDir) _verifyDir = await Directory.create('vci');

  const result = await verify(shc.trim(), _verifyDir);

  if (!result.verified) throw result.reason.split('|');
  
  return(result.data.fhirBundle);
}
