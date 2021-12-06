# Token filterer

```pug

.nz-token-filterer(single, history="unique-id-for-history", load-last)
   nz-token-filter(label="Manufacturer", comparsions="eq,neq,in,between")
      nz-token-filter-list([dataSource]="", displayField="name", valueField="id")

      nz-token-filter-date
      nz-token-filter-text
      nz-token-filter-number


   nz-token-filter(label="Active", comparsions="eq")
      nz-token-filter-bool(trueLabel="Yes", falseLabel="No")

```
