/* Isso – Ich schrei sonst!
 *
 * Copyright 2013, Martin Zimmermann <info@posativ.org>. All rights reserved.
 * License: BSD Style, 2 clauses. See isso/__init__.py.
 */


define(["lib/q", "lib/HTML", "helper/utils", "./api", "./forms", "./logging"], function(Q, HTML, utils, api, forms, logging) {

    var defaults = {
        text: "Lorem ipsum ...", author: "Anonymous",
        email: "info@example.org", website: "..."
    };

    var insert = function(comment, scrollIntoView) {
        /*
         * insert a comment (JSON/object) into the #isso-thread or below a parent (#isso-N), renders some HTML and
         * registers events to reply to, edit and remove a comment.
         */

        if (comment.parent) {
            entrypoint = HTML.query("#isso-" + comment.parent).add("div.isso-follow-up");
        } else {
            entrypoint = HTML.query("div#isso-root")
        }

        entrypoint.add("article.isso-comment#isso-" + comment.id)
                  .add("header+span.avatar+div.text+footer")
        var node = HTML.query("#isso-" + comment.id),
            date = new Date(parseInt(comment.created) * 1000);

        if (comment.mode == 2) {
            node.header.add("span.note").textContent = 'Kommentar muss noch freigeschaltet werden';
        } else if (comment.mode == 4) {  // deleted
            node.classList.add('deleted');
            node.header.add("span.note").textContent = "Kommentar gelöscht."
        }

        if (comment.website) {
            var el = node.header.add("a.author")
            el.textContent= comment.author || 'Anonymous';
            el.href = comment.website;
            el.rel = "nofollow"
        } else {
            node.header.add("span.author").innerHTML = comment.author || 'Anonymous';
        }

        node.header.add("span.spacer").textContent = "•";

        var permalink = node.header.add("a.permalink");
        permalink.href = '#isso-' + comment.id;
        permalink.add("date[datetime=" + date.getUTCFullYear() + "-" + date.getUTCMonth() + "-" + date.getUTCDay() + "]")
            .textContent = utils.ago(date);

        node.query("span.avatar").add("img[width=48 height=48]");

        if (comment.mode == 4) {
            node.query(".text").add("p").value = "&nbsp;"
        } else {
            node.query(".text").innerHTML = comment.text;
        }

        node.footer.add("a.liek{Liek}").href = "#";
        node.footer.add("a.reply{Antworten}").href = "#";

        if (scrollIntoView) {
            node.scrollIntoView(false);
        }

        if (utils.read(window.location.pathname + "-" + comment.id)) {
            node.footer.add("a.delete{Löschen}").href = "#";
            node.footer.add("a.edit{Bearbeiten}").href = "#";

            var delbtn = node.query("a.delete"),
                editbtn = node.query("a.edit");

            delbtn.addEventListener("click", function(event) {
                if (delbtn.textContent == "Bestätigen") {
                    api.remove(comment.id).then(function(rv) {
                        if (rv) {
                            node.remove();
                        } else {
                            // XXX recursively remove deleted comments
                        }
                    })
                } else {
                    delbtn.textContent = "Bestätigen"
                    setTimeout(function() {delbtn.textContent = "Löschen"}, 1500)
                }
                event.preventDefault();
            })
        }

//            // EDIT
//            $('#isso_' + post['id'] + ' > footer .edit').on('click', function(event) {
//
//                if ($('#issoform_' + post['id']).length == 0) {  // HTML form not shown
//                    isso.plain(post['id'], function(status, rv) {
//                        if (status != 200) return alert('Mööp');
//                        var rv = form(post['id'], JSON.parse(rv), function(form, id) {
//                            isso.modify(id, extract(form, post['parent']), function(status, rv) {
//                                if (status != 200) return alert('Mööp');
//
//                                $('#issoform_' + post['id']).remove();
//                                $('#isso_' + post['id']).remove();
//                                insert(JSON.parse(rv));
//                            });
//                        });
//
//                        $('#isso_' + post['id']).after(rv);
//                        $('input[type="submit"]', rv)[0].value = 'Bestätigen.';
//                    });
//                } else {
//                    $('#issoform_' + post['id']).remove();
//                };
//                event.stop();
//            });
//        };

        // ability to answer directly to a comment
        HTML.query("#isso-" + comment.id + " a.reply").addEventListener("click", function(event) {

            // remove active form when clicked again or reply to another comment
            var active = HTML.query(".isso-active-msgbox");  // [] when empty, element if not

            if (! (active instanceof Array)) {
               active.query("div.isso-comment-box").remove()
               active.classList.remove("isso-active-msgbox");
               active.query("a.reply").textContent = "Antworten"

               if (active.id == "isso-" + comment.id) {
                   event.preventDefault();
                   return;
               }
            }

            var msgbox = forms.msgbox({})
            HTML.query("#isso-" + comment.id).footer.appendChild(msgbox);
            HTML.query("#isso-" + comment.id).classList.add("isso-active-msgbox");
            HTML.query("#isso-" + comment.id + " a.reply").textContent = "Schließen";

            msgbox.scrollIntoView(false);
            msgbox.query("input[type=submit]").addEventListener("click", function(event) {
                forms.validate(msgbox) && api.create({
                    author: msgbox.query("[name=author]").value,
                    email: msgbox.query("[name=email]").value,
                    website: msgbox.query("[name=website]").value,
                    text: msgbox.query("textarea").value,
                    parent: comment.id })
                .then(function(rv) {
                    // remove box on submit
                    msgbox.parentNode.parentNode.classList.remove("isso-active-msgbox");
                    msgbox.parentNode.parentNode.query("a.reply").textContent = "Antworten"
                    msgbox.remove()
                    insert(rv, true);
                })
                event.preventDefault()
            });
        event.preventDefault();
        });
    }

    var init = function() {

        console.log(utils.heading());

        var rootmsgbox = forms.msgbox({});
        HTML.query("#isso-thread").add("div#isso-root").add(rootmsgbox);
        rootmsgbox.query("input[type=submit]").addEventListener("click", function(event) {
            forms.validate(rootmsgbox) && api.create({
                author: rootmsgbox.query("[name=author]").value,
                email: rootmsgbox.query("[name=email]").value,
                website: rootmsgbox.query("[name=website]").value,
                text: rootmsgbox.query("textarea").value,
                parent: null })
            .then(function(rv) {
                rootmsgbox.query("[name=author]").value = "";
                rootmsgbox.query("[name=email]").value = "";
                rootmsgbox.query("[name=website]").value = "";
                rootmsgbox.query("textarea").value = "";
                insert(rv);
            })
            event.preventDefault()
        });

        api.fetchall()
        .then(function(comments) {
            for (var i in comments) {
                insert(comments[i])
            }})
        .fail(logging.error)
    }

    return {
        init: init
    }
});