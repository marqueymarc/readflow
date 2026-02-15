async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status) {
  return status === 429 || status >= 500;
}

async function deleteArticle(env, articleId) {
  const token = await getReadwiseToken(env);
  if (!token) throw new Error('Readwise token is not configured');
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(
      `https://readwise.io/api/v3/delete/${articleId}/`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );

    if (response.ok || response.status === 204) return;
    if (attempt < maxAttempts && isRetryableStatus(response.status)) {
      await sleep(200 * attempt);
      continue;
    }
    throw new Error(`Delete failed: ${response.status}`);
  }
}

async function archiveArticle(env, articleId) {
  await moveArticleToLocation(env, articleId, 'archive');
}

async function moveArticleToLocation(env, articleId, targetLocation) {
  const token = await getReadwiseToken(env);
  if (!token) throw new Error('Readwise token is not configured');
  const safeTarget = typeof targetLocation === 'string' && targetLocation.trim()
    ? targetLocation.trim()
    : 'feed';
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(
      `https://readwise.io/api/v3/update/${articleId}/`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location: safeTarget }),
      }
    );

    if (response.ok) return;
    if (attempt < maxAttempts && isRetryableStatus(response.status)) {
      await sleep(200 * attempt);
      continue;
    }
    throw new Error(`Move to "${safeTarget}" failed: ${response.status}`);
  }
}

async function addToReadwise(env, url) {
  const token = await getReadwiseToken(env);
  if (!token) throw new Error('Readwise token is not configured');
  const response = await fetch('https://readwise.io/api/v3/save/', {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error(`Add failed: ${response.status}`);
  }
}

async function getReadwiseToken(env) {
  const customToken = await env.KV.get('custom_readwise_token');
  if (customToken && customToken.trim()) return customToken.trim();
  if (typeof env.READWISE_TOKEN === 'string' && env.READWISE_TOKEN.trim()) return env.READWISE_TOKEN.trim();
  return null;
}

async function getOpenAIKey(env) {
  const customKey = await env.KV.get('custom_openai_key');
  if (customKey && customKey.trim()) return customKey.trim();
  if (typeof env.OPENAI_API_KEY === 'string' && env.OPENAI_API_KEY.trim()) return env.OPENAI_API_KEY.trim();
  return null;
}

export {
  addToReadwise,
  archiveArticle,
  deleteArticle,
  getOpenAIKey,
  getReadwiseToken,
  moveArticleToLocation,
};
