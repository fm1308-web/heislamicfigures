// ═══════════════════════════════════════════════════════════
// VALIDATORS — read-only data checks, run once at boot
// ═══════════════════════════════════════════════════════════

function validateJourneys(){
  return new Promise(function(resolve){
    // Ensure journey data is loaded
    function run(){
      var problems=0, checked=0;
      var figs=window._journeyCache||{};
      var files=Object.keys(figs);
      if(!files.length){ console.log('[validateJourneys] no journey data loaded, skipping'); resolve(); return; }

      // Build index filename set for registration check
      var indexFiles=new Set();
      if(typeof _fwIndex!=='undefined'&&_fwIndex.length){
        _fwIndex.forEach(function(item){ indexFiles.add(item.file); });
      }

      files.forEach(function(filename){
        checked++;
        var d=figs[filename];
        if(!d) return;

        // a. SLUG MATCH: confirm slug exists in PEOPLE
        var slug=d.slug;
        var coreFig=null;
        if(slug&&typeof PEOPLE!=='undefined'){
          coreFig=PEOPLE.find(function(p){ return p.slug===slug; });
        }
        if(!coreFig){
          console.warn('[validateJourneys] SLUG MISMATCH: '+filename+' has slug "'+slug+'" but no match in core.json?v=fixture1');
          problems++;
        }

        // b. INDEX REGISTRATION
        if(indexFiles.size&&!indexFiles.has(filename)){
          console.warn('[validateJourneys] NOT IN INDEX: '+filename+' not listed in index.json?v=fixture1');
          problems++;
        }

        // c. LIFESPAN SANITY
        if(coreFig&&d.journey&&d.journey.length){
          var birth=coreFig.dob, death=coreFig.dod;
          d.journey.forEach(function(entry){
            if(entry.year==null) return;
            if(birth!=null&&entry.year<birth){
              console.warn('[validateJourneys] YEAR OUT OF RANGE: '+slug+' entry year '+entry.year+' < birth '+birth);
              problems++;
            }
            if(death!=null&&entry.year>death){
              console.warn('[validateJourneys] YEAR OUT OF RANGE: '+slug+' entry year '+entry.year+' > death '+death);
              problems++;
            }
          });
        }
      });

      // Summary
      if(problems===0){
        console.log('%c[validateJourneys] '+checked+' files checked, 0 problems found — all clean \u2713','color:#4caf50;font-weight:bold');
      } else {
        console.log('[validateJourneys] '+checked+' files checked, '+problems+' problems found');
      }
      resolve();
    }

    // If journey cache already populated, run immediately
    if(window._journeyCache&&Object.keys(window._journeyCache).length){
      run();
    } else {
      // Trigger _fwLoadAll to populate the cache
      if(typeof _fwLoadAll==='function'){
        _fwLoadAll(function(){ run(); });
      } else {
        console.log('[validateJourneys] _fwLoadAll not available, skipping');
        resolve();
      }
    }
  });
}

window._validators={
  validateJourneys: validateJourneys
};
