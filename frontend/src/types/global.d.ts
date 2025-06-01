export type Company = {
  mcap: number
  companyshortname: string
  companyname: string
  isin: string
  sectorname: string
  industryname: string
  type: string
  bsecode?: string
  nsesymbol?: string
}

export type BubbleDatum = {
  name: string
  value: number
  data: Company
}

export type Dimensions = {
  width: number
  height: number
}