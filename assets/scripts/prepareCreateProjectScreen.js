function makeCreateProjectButtonListener(accessToken, login, origin, buildStatus) {
    const repoName = origin; // per Github pages convention
    const publishedWebsiteURL = `https://${repoName}/`;

    return () => {
        d3.json("https://api.github.com/user/repos", {
            headers: {Authorization: "token " + accessToken},
            method: "POST",
            body: JSON.stringify(
                {
                    name: repoName,
                    homepage: publishedWebsiteURL,
                    has_issues: false,
                    has_projects: false,
                    has_wiki: false,
                    auto_init: false
                }
            )
        })
            .then(() => {
                return d3.json("https://api.github.com/repos/daktary-team/coup-de-pinceau/contents/index.md", {
                    headers: {Authorization: "token " + accessToken}
                })
                    .then(({content}) => {
                        return d3.json(`https://api.github.com/repos/${login}/${origin}/contents/index.md`, {
                            headers: {Authorization: "token " + accessToken},
                            method: "PUT",
                            body: JSON.stringify(
                                {
                                    message: "crée le index.md",
                                    content
                                }
                            )
                        })
                    })
            })

            .then(() => {
                return d3.json(`https://api.github.com/repos/${login}/${origin}/contents/_config.yml`, {
                    headers: {Authorization: "token " + accessToken},
                    method: "PUT",
                    body: JSON.stringify(
                        {
                            message: "crée le _config.yml",
                            content: Buffer.from(`theme: jekyll-theme-cayman`).toString('base64')
                        }
                    )
                })
            })

            .then(() => {
                return d3.json(`https://api.github.com/repos/${login}/${origin}/contents/example.md`, {
                    headers: {Authorization: "token " + accessToken},
                    method: "PUT",
                    body: JSON.stringify(
                        {
                            message: "création de la page d'exemple",
                            content: Buffer.from(
                                '---\n---\n\n# Exemple de titre\n\n' +
                                'Hey ! Voici un contenu en [markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#table-of-contents)'
                            ).toString('base64')
                        }
                    )
                })
            })

            .then(() => {
                return new Promise((resolve, reject) => {
                    const unsubscribe = buildStatus.subscribe(newStatus => {
                        if (newStatus === 'built') {
                            resolve();
                            unsubscribe();
                            return;
                        }
                        if (newStatus === 'errored') {
                            reject();
                            unsubscribe();
                            return;
                        }
                    });

                    buildStatus.checkStatus();
                })
            })

            .then(() => {
                location.href = "#youpi";
                const LinkWebsite = document.querySelector("#youpi .show-site");
                LinkWebsite.href = publishedWebsiteURL;
            })
    }
}

let currentlyAttachedListener = undefined;

export default function (accessToken, login, origin, buildStatus) {
    const originElement = document.querySelector("#create-project .origin");
    originElement.textContent = origin;
    const button = document.querySelector("#create-project .submit");

    if (currentlyAttachedListener) {
        button.removeEventListener("click", currentlyAttachedListener);
    }

    const buttonListener = makeCreateProjectButtonListener(accessToken, login, origin, buildStatus);

    button.addEventListener("click", buttonListener);
    currentlyAttachedListener = buttonListener;
}