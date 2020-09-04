import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {getSchemaTypes} from "../../compile/validate/dataType"
import {checkDataTypes, DataType} from "../../compile/util"
import {_, str, Name} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "uniqueItems",
  type: "array",
  schemaType: "boolean",
  $data: true,
  code(cxt: KeywordContext) {
    const {gen, data, $data, schema, parentSchema, schemaCode, it} = cxt
    if (!$data && !schema) return
    const valid = gen.let("valid")
    const itemTypes = parentSchema.items ? getSchemaTypes(it, parentSchema.items) : []
    cxt.block$data(valid, validateUniqueItems, _`${schemaCode} === false`)
    cxt.ok(valid)

    function validateUniqueItems() {
      const i = gen.let("i", _`${data}.length`)
      const j = gen.let("j")
      cxt.setParams({i, j})
      gen.assign(valid, true)
      gen.if(_`${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j))
    }

    function canOptimize(): boolean {
      return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array")
    }

    function loopN(i: Name, j: Name): void {
      const item = gen.name("item")
      const wrongType = checkDataTypes(itemTypes, item, it.opts.strict, DataType.Wrong)
      const indices = gen.const("indices", _`{}`)
      gen.for(_`;${i}--;`, () => {
        gen.let(item, _`${data}[${i}]`)
        gen.if(wrongType, _`continue`)
        if (itemTypes.length > 1) gen.if(_`typeof ${item} == "string"`, _`${item} += "_"`)
        gen
          .if(_`typeof ${indices}[${item}] == "number"`, () => {
            gen.assign(j, _`${indices}[${item}]`)
            cxt.error()
            gen.assign(valid, false).break()
          })
          .code(_`${indices}[${item}] = ${i}`)
      })
    }

    function loopN2(i: Name, j: Name): void {
      const outer = gen.name("outer")
      gen.label(outer).for(_`;${i}--;`, () =>
        gen.for(_`${j} = ${i}; ${j}--;`, () =>
          gen.if(_`equal(${data}[${i}], ${data}[${j}])`, () => {
            cxt.error()
            gen.assign(valid, false).break(outer)
          })
        )
      )
    }
  },
  error: {
    message: ({params: {i, j}}) =>
      str`should NOT have duplicate items (items ## ${j} and ${i} are identical)`,
    params: ({params: {i, j}}) => _`{i: ${i}, j: ${j}}`,
  },
}

module.exports = def