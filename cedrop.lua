local list = {
      "D2Game.dll.text+0xed9b", -- unique
      "D2Game.dll.text+0xee1c", -- set
      "D2Game.dll.text+0xeeac", -- rare
      "D2Game.dll.text+0xef2f", -- magic
}

for k, v in ipairs(list) do
    debug_removeBreakpoint(v)
    debug_setBreakpoint(v)
end

function debugger_onBreakpoint ()
         print(ESI)
         return 1
end
