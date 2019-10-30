# Grammar for track searching.
@builtin "whitespace.ne"
@builtin "string.ne"

search -> null | searchItem:+ {% id %}

searchItem ->
    "artist:"    stringList {% item %}
  | "album:"     stringList {% item %}
  | "release:"   stringList {% item %}
  | "publisher:" stringList {% item %}
  | "genre:"     stringList {% item %}
  | "key:"       keyList    {% item %}
  | "artwork:"   bool       {% item %}

# Musical key notations
keyList -> null | keyItem:+ {% id %}
keyItem -> camelotKey ",":? {% withHasComma %}

camelotKey ->
  ("0":? [1-9] {% join %} | "1" [0-2] {% join %})
  ([ABab] {% id %}) {% parts => ({
    value: parts.join(''),
    type: 'musical_key',
  }) %}

# Strings
stringList -> null | stringItem:+ {% id %}
stringItem -> string ",":? {% withHasComma %}
string ->
    dqstring {% ([value]) => ({ value, quoted: true }) %}

# Boolean values
bool -> "true" {% _ => true %} | "false" {% _ => false %}

@{%
  function join (data) {
    return data.join('');
  }

  function withHasComma([values, comma]) {
    return {...values, trailingComma: !!comma};
  }

  function item([key, values]) {
    return {type: key.slice(0, -1), values};
  }
%}
