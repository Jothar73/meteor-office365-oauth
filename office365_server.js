/*globals Office365, OAuth */
'use strict';

Office365 = {};

let userAgent = 'Meteor';
if (Meteor.release) { userAgent += `/${ Meteor.release }`; }

const getAccessToken = function(query) {
  console.log('ue> getAccessToken');
  try{
  const config = ServiceConfiguration.configurations.findOne({service: 'office365'});
  if (!config) { throw new ServiceConfiguration.ConfigError(); }

  const redirectUri = OAuth._redirectUri('office365', config).replace('?close', '');

  let response;
  try {
    response = HTTP.post(
      `https://login.microsoftonline.com/${ config.tenant || 'common' }/oauth2/v2.0/token`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': userAgent
        },
        params: {
          grant_type: 'authorization_code',
          code: query.code,
          client_id: config.clientId,
          client_secret: OAuth.openSecret(config.secret),
          redirect_uri: redirectUri,
          state: query.state
        }
      });
  console.log('ue> got response');
  console.log('ue> response');
  } catch (error) {
    console.log('ERROR');
    console.log(error);
    throw _.extend(new Error(`Failed to complete OAuth handshake with Microsoft Office365. ${ error.message }`), {response: error.response});
  }
  if (response.data.error) {
    console.log('ERROR');
    console.log(response.data.error);
    throw new Error(`Failed to complete OAuth handshake with Microsoft Office365. ${ response.data.error }`);
  } else {
  console.log('ue> all good');
    return response.data.access_token;
  }
  }
  catch(err){
    console.log(err);
  }
  return null;
};

const getIdentity = function(accessToken) {
    console.log('ue> getIdentity');
  try {
    const ident= HTTP.get(
      'https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${ accessToken }`,
          Accept: 'application/json',
          'User-Agent': userAgent
        }
      }).data;
    console.log('ue> got Identity');
    console.log(ident);
    
    return ident;
  } catch (error) {
    console.log('ERROR');
    console.log(error);
    throw _.extend(new Error(`Failed to fetch identity from Microsoft Office365. ${ error.message }`), {response: error.response});
  }
};

OAuth.registerService('office365', 2, null, function(query) {
  console.log(`ue> OAuth.registerService('office365',`);
  try{
    console.log(query);
  const accessToken = getAccessToken(query);
  const identity = getIdentity(accessToken);
  console.log(accessToken);
  console.log(identity);
  console.log(OAuth.sealSecret(accessToken));
    console.log('ue> looking good');
  return  {
    serviceData: {
      id: identity.id,
      accessToken: OAuth.sealSecret(accessToken),
      displayName: identity.displayName,
      givenName: identity.givenName,
      surname: identity.surname,
      username: identity.userPrincipalName && identity.userPrincipalName.split('@')[0],
      userPrincipalName: identity.userPrincipalName,
      mail: identity.mail,
      jobTitle: identity.jobTitle,
      mobilePhone: identity.mobilePhone,
      businessPhones: identity.businessPhones,
      officeLocation: identity.officeLocation,
      preferredLanguage: identity.preferredLanguage
    },
    options: {profile: {name: identity.givenName}}
  };
  }
  catch(err){
    console.log('ERROR');
    console.log(err);
  }
  return null;
});

Office365.retrieveCredential = function(credentialToken, credentialSecret) {
  console.log(`Office365.retrieveCredential`);
  try{
  const cred = OAuth.retrieveCredential(credentialToken, credentialSecret);
    
    console.log('ue> got cred');
    console.log(cred);
    return cred;
  }
  catch(err){
    console.log('ERROR');
    console.log(err);
  }
  return null;
};
