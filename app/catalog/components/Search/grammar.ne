@{% const lexer = require('./lexer.tsx').default %}

@lexer lexer

search -> null | item:+ {% mergeFreeText %}

item ->
    %word       {% lexerId %}
  | %space      {% lexerId %}
  | searchItem  {% id %}

searchItem ->
    "id:"        value:?  {% filter %}
  | "title:"     value:?  {% filter %}
  | "artist:"    value:?  {% filter %}
  | "album:"     value:?  {% filter %}
  | "release:"   value:?  {% filter %}
  | "publisher:" value:?  {% filter %}
  | "genre:"     value:?  {% filter %}
  | "key:"       value:?  {% filter %}
  | "artwork:"   value:?  {% filter %}

value ->
    %value   {% lexerId %}
  | %boolean {% lexerId %}

@{%
const lexerId = ([{ type, value, offset }]) => ({ type, value, offset });

const filter = ([key, value]) => ({
  type: "filter",
  offset: key.offset,
  key: { type: key.value.slice(0, -1), offset: key.offset },
  value
});

const isFreeText = obj => ["space", "word"].includes(obj.type);

const mergeFreeText = ([items]) =>
  items.reduce((acc, current, i) => {
    const isFree = isFreeText(current);

    // Accumulate like normal if our value is not a freeText value.
    if (!isFree) {
      return [...acc, current];
    }

    // If our current item is a space and the next item is _not_ a freeText
    // item, we want to turn this space into a 'blankSpace' type to ensure it
    // does not end up in our freeText value.
    const next = items[i + 1];

    if (current.type === "space" && next !== undefined && !isFreeText(next)) {
      return [...acc, { ...current, type: "blankSpace" }];
    }

    // Our current value is a freeText object. Transform it and merge it into
    // the previous object if it was also a freeText object.
    const transformed = { ...current, type: "freeText" };

    if (acc.length === 0) {
      return [transformed];
    }

    const last = acc.pop();
    const insert =
      last.type === "freeText"
        ? [{ ...last, value: `${last.value}${current.value}` }]
        : [last, transformed];

    return [...acc, ...insert];
  }, []);
%}
